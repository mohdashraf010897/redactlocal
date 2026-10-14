// Screenshots of a real web UI (the user's app) for the Screenshot component (src/kit/screens.tsx).
//   npm run shoot -- <name> <url> [--selector css] [--redact ".email,.token"]
//   npm run shoot -- <name> --steps shots.json          a click-through flow: several shots plus button positions
//   options: [--serve "npm run dev" --cwd ../app] [--width 1440 --height 900] [--scale 2] [--profile] [--login]
// Writes public/shots/<name>/<shot>.png and src/shots/<name>.ts with each image's size and the boxes of the
// elements you clicked or marked (in image pixels), so Cursor, highlight and zoom land on the real thing.
// --login opens a visible browser: sign in, then close the window. The session is kept in out/browser-profile
// (never committed) and reused with --profile. Passwords are never stored by this script.
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { ROOT, browserTries, parseArgs } from "./lib.mjs";

const { pos, opt } = parseArgs(process.argv.slice(2));
const [name, url] = pos;
const usage = 'Usage: npm run shoot -- <name> <url> [--selector css] [--redact "css,css"]  |  npm run shoot -- <name> --steps file.json';
if (!name || !/^[A-Za-z][\w-]*$/.test(name) || (!url && !opt.steps)) { console.error(usage); process.exit(2); }

const spec = opt.steps
  ? JSON.parse(fs.readFileSync(path.resolve(opt.steps), "utf8"))
  : { url, steps: [{ shoot: "main", ...(opt.selector ? { selector: opt.selector } : {}) }] };
const base = url ?? spec.url;
if (!base) { console.error('The steps file needs a "url" (or pass one on the command line).'); process.exit(2); }
const width = Number(opt.width ?? spec.width ?? 1440), height = Number(opt.height ?? spec.height ?? 900);
const scale = Number(opt.scale ?? spec.scale ?? 2);
const redact = [...(typeof opt.redact === "string" ? opt.redact.split(",") : []), ...(spec.redact ?? [])].map((s) => s.trim()).filter(Boolean);
const profileDir = path.join(ROOT, "out", "browser-profile");

// Start the app's dev server if asked, and wait until the URL answers.
let server;
if (opt.serve) {
  server = spawn(opt.serve, { cwd: path.resolve(opt.cwd ?? "."), shell: true, stdio: "ignore", detached: true, env: { ...process.env, BROWSER: "none" } });
  const until = Date.now() + Number(opt.timeout ?? 120) * 1000;
  process.stdout.write(`Waiting for ${base} `);
  for (;;) {
    try { await fetch(base); break; } catch { /* not up yet */ }
    if (Date.now() > until || server.exitCode !== null) { console.error(`\n${base} did not answer; is "${opt.serve}" the right command?`); stop(); process.exit(1); }
    await new Promise((r) => setTimeout(r, 1000));
  }
  console.log("ok");
}
function stop() { if (server) { try { process.kill(-server.pid); } catch { /* already gone */ } } }

const { chromium } = await import("playwright-core");
async function open(headless) {
  const o = { headless, viewport: { width, height }, deviceScaleFactor: scale, reducedMotion: "reduce", colorScheme: spec.colorScheme ?? "light" };
  for (const t of browserTries()) {
    try {
      if (opt.profile || opt.login) { fs.mkdirSync(profileDir, { recursive: true }); return await chromium.launchPersistentContext(profileDir, { ...t, ...o }); }
      const b = await chromium.launch({ ...t, headless });
      const c = await b.newContext(o);
      c.on("close", () => b.close());
      return c;
    } catch { /* try the next browser */ }
  }
  throw new Error("No browser found. Install Google Chrome or Microsoft Edge, or set DECK_BROWSER=/path/to/chrome.");
}

if (opt.login) {
  const ctx = await open(false);
  const page = ctx.pages()[0] ?? (await ctx.newPage());
  await page.goto(base);
  console.log("Sign in in the browser window, then close it. The session is saved in out/browser-profile.");
  await new Promise((r) => ctx.on("close", r));
  stop();
  process.exit(0);
}

const ctx = await open(true);
const page = ctx.pages()[0] ?? (await ctx.newPage());
const settle = async () => {
  await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
  await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}" }).catch(() => {});
  await page.waitForTimeout(150);
};
const at = (u) => new URL(u, base).toString();
await page.goto(at(base));
await settle();

const outDir = path.join(ROOT, "public", "shots", name);
fs.mkdirSync(outDir, { recursive: true });
const shots = {};
// click / type / hover boxes go on the latest shot (the screen the viewer sees before the action);
// mark boxes go on the next shot (mark what appears, then shoot it).
let last = null, marks = [];
const px = (b, clip) => ({ x: Math.round((b.x - (clip?.x ?? 0)) * scale), y: Math.round((b.y - (clip?.y ?? 0)) * scale), w: Math.round(b.width * scale), h: Math.round(b.height * scale) });
const keyOf = (s) => s.replace(/^text=/, "").replace(/[^A-Za-z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : "")).replace(/^./, (c) => c.toLowerCase()) || "el";
const box = async (sel) => {
  const b = await page.locator(sel).first().boundingBox();
  if (!b) throw new Error(`"${sel}" is not visible`);
  return b;
};
const mark = async (sel, as) => { const b = await box(sel); if (last) last.boxes[as ?? keyOf(sel)] = px(b, last.clip); };

try {
  for (const s of spec.steps ?? []) {
    if (s.goto) { await page.goto(at(s.goto)); await settle(); }
    else if (s.click) { await mark(s.click, s.as); await page.locator(s.click).first().click(); await settle(); }
    else if (s.hover) { await mark(s.hover, s.as); await page.locator(s.hover).first().hover(); await settle(); }
    else if (s.type) { await mark(s.type, s.as); await page.locator(s.type).first().fill(s.text ?? ""); await settle(); }
    else if (s.press) { await page.keyboard.press(s.press); await settle(); }
    else if (s.mark) marks.push([s.as ?? keyOf(s.mark), await box(s.mark)]);
    else if (s.wait !== undefined) { if (typeof s.wait === "number") await page.waitForTimeout(s.wait); else await page.locator(s.wait).first().waitFor(); await settle(); }
    else if (s.shoot) {
      const clip = s.selector ? await page.locator(s.selector).first().boundingBox() : null;
      if (s.selector && !clip) throw new Error(`"${s.selector}" is not visible`);
      // Solid boxes over sensitive elements, drawn in the page so they are in the PNG itself.
      const hide = [...redact, ...(s.redact ?? [])];
      await page.evaluate((sels) => {
        for (const sel of sels) for (const el of document.querySelectorAll(sel)) {
          const r = el.getBoundingClientRect(), d = document.createElement("div");
          d.dataset.deckRedact = "";
          Object.assign(d.style, { position: "fixed", left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, background: "#D9D6CF", borderRadius: "4px", zIndex: 2147483647 });
          document.body.appendChild(d);
        }
      }, hide);
      const file = path.join(outDir, `${s.shoot}.png`);
      await page.screenshot({ path: file, ...(clip ? { clip } : {}) });
      await page.evaluate(() => document.querySelectorAll("[data-deck-redact]").forEach((d) => d.remove()));
      const w = Math.round((clip?.width ?? width) * scale), h = Math.round((clip?.height ?? height) * scale);
      last = shots[s.shoot] = { src: `shots/${name}/${s.shoot}.png`, w, h, boxes: Object.fromEntries(marks.map(([k, b]) => [k, px(b, clip)])), clip };
      marks = [];
      console.log(`  ${s.shoot}.png  ${w}x${h}`);
    } else throw new Error(`Unknown step ${JSON.stringify(s)}`);
  }
} finally {
  await ctx.close();
  await ctx.browser()?.close();
  stop();
}

const dir = path.join(ROOT, "src", "shots");
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, `${name}.ts`);
const body = Object.entries(shots).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify({ src: v.src, w: v.w, h: v.h, boxes: v.boxes })},`).join("\n");
fs.writeFileSync(file, `// Captured with: npm run shoot -- ${name} ${opt.steps ? `--steps ${opt.steps}` : base}\n` +
  `// Sizes and boxes are in image pixels (x${scale}). Look at every PNG before sharing: only --redact selectors are hidden.\n` +
  `import { Rect } from "../kit/ui";\n\nexport const ${name.replace(/-(\w)/g, (_, c) => c.toUpperCase())}: Record<string, { src: string; w: number; h: number; boxes: Record<string, Rect> }> = {\n${body}\n};\n`);
console.log(`${Object.keys(shots).length} shots -> public/shots/${name}/, ${path.relative(ROOT, file)}`);
