// Shared helpers for dev.mjs, render.mjs and still.mjs: build, serve, and drive a headless browser.
import * as esbuild from "esbuild";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function parseArgs(argv) {
  const pos = [], opt = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const [k, v] = a.slice(2).split("=");
      if (v !== undefined) opt[k] = v;
      else if (argv[i + 1] && !argv[i + 1].startsWith("--")) opt[k] = argv[++i];
      else opt[k] = true;
    } else pos.push(a);
  }
  return { pos, opt };
}

export const esbuildOptions = (outdir, dev) => ({
  entryPoints: [path.join(ROOT, "src/main.tsx")],
  bundle: true, format: "esm", jsx: "automatic", target: "es2022", outdir, logLevel: "error",
  define: { __DEV__: String(dev), "process.env.NODE_ENV": dev ? '"development"' : '"production"' },
});

// Static site layout shared by dev and render: index.html, main.js, public/.
export function prepareDir(dir, linkPublic) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(ROOT, "index.html"), path.join(dir, "index.html"));
  const src = path.join(ROOT, "public"), dst = path.join(dir, "public");
  if (linkPublic) { try { fs.symlinkSync(src, dst, "junction"); return; } catch { /* fall back to a copy */ } }
  fs.cpSync(src, dst, { recursive: true });
}

export async function buildSite() {
  const dir = path.join(ROOT, ".deck", "dist");
  prepareDir(dir, false);
  await esbuild.build(esbuildOptions(dir, false));
  return dir;
}

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".json": "application/json", ".webp": "image/webp", ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime", ".wav": "audio/wav", ".mp3": "audio/mpeg" };

export function serve(dir) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const p = path.join(dir, decodeURIComponent(new URL(req.url, "http://x").pathname));
      const file = p.startsWith(dir) && fs.existsSync(p) && fs.statSync(p).isFile() ? p : path.join(dir, "index.html");
      if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
      const type = TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream";
      const size = fs.statSync(file).size;
      const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range ?? ""); // video and audio need ranges to seek
      if (range) {
        const start = range[1] ? Number(range[1]) : size - Number(range[2]);
        const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
        res.writeHead(206, { "content-type": type, "accept-ranges": "bytes", "content-range": `bytes ${start}-${end}/${size}`, "content-length": end - start + 1 });
        fs.createReadStream(file, { start, end }).pipe(res);
        return;
      }
      res.writeHead(200, { "content-type": type, "accept-ranges": "bytes", "content-length": size });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, "127.0.0.1", () => resolve({ server, url: `http://127.0.0.1:${server.address().port}/` }));
  });
}

// Uses a browser that is already installed: DECK_BROWSER (path), else Google Chrome, else Microsoft Edge,
// else a Chromium installed with `npx playwright-core install chromium`. Nothing is downloaded automatically.
export const browserTries = () => process.env.DECK_BROWSER ? [{ executablePath: process.env.DECK_BROWSER }] : [{ channel: "chrome" }, { channel: "msedge" }, {}];

export async function launch() {
  const { chromium } = await import("playwright-core");
  const args = ["--font-render-hinting=none", "--disable-lcd-text"];
  for (const t of browserTries()) {
    try { return await chromium.launch({ ...t, args }); } catch { /* try the next browser */ }
  }
  throw new Error("No browser found. Install Google Chrome or Microsoft Edge, or set DECK_BROWSER=/path/to/chrome.");
}

export async function openComp(browser, url, id) {
  const probe = await browser.newPage();
  await probe.goto(`${url}?render=1&comp=${encodeURIComponent(id)}`);
  await probe.waitForFunction(() => window.__deck);
  const meta = await probe.evaluate((cid) => window.__deck.compositions.find((c) => c.id === cid), id);
  await probe.close();
  if (!meta) throw new Error(`Unknown composition "${id}"`);
  const page = await browser.newPage({ viewport: { width: meta.width, height: meta.height }, deviceScaleFactor: 1 });
  page.on("pageerror", (err) => console.error("page error:", err.message));
  await page.goto(`${url}?render=1&comp=${encodeURIComponent(id)}`);
  await page.waitForFunction(() => window.__deck);
  return { page, meta };
}

export async function listComps(browser, url) {
  const page = await browser.newPage();
  page.on("pageerror", (err) => console.error("page error:", err.message));
  await page.goto(`${url}?render=1`);
  await page.waitForFunction(() => window.__deck);
  const comps = await page.evaluate(() => window.__deck.compositions);
  await page.close();
  return comps;
}

export async function shoot(page, frame, type = "png") {
  await page.evaluate((f) => window.__deck.setFrame(f), frame);
  return page.screenshot({ type, quality: type === "jpeg" ? 95 : undefined });
}

// Labelled contact sheet of PNG files. `items` are [file, caption]; cells are 640 px wide.
export async function contactSheet(browser, items, out, { cols, aspect = 16 / 9 } = {}) {
  const n = cols ?? (items.length <= 4 ? 2 : 3);
  const w = 640, h = Math.round(w / aspect);
  const sheet = await browser.newPage({ viewport: { width: n * (w + 16) + 16, height: 400 } });
  const cells = items.map(([file, cap]) => `<figure><img src="data:image/png;base64,${fs.readFileSync(file).toString("base64")}"><figcaption>${cap}</figcaption></figure>`).join("");
  await sheet.setContent(`<style>body{margin:0;padding:16px;background:#222;display:grid;grid-template-columns:repeat(${n},${w}px);gap:16px;font:14px system-ui;color:#ddd}figure{margin:0}img{width:${w}px;height:${h}px;display:block;object-fit:contain;background:#000}figcaption{padding-top:4px}</style>${cells}`);
  await sheet.screenshot({ path: out, fullPage: true });
  await sheet.close();
  return out;
}

// Folder for one run's output, e.g. out/stills/101530-123. A new folder per run keeps image viewers honest.
export function runDir(kind, custom) {
  const now = new Date();
  const stamp = now.toTimeString().slice(0, 8).replace(/:/g, "") + "-" + String(now.getMilliseconds()).padStart(3, "0");
  const dir = path.resolve(custom ?? path.join(ROOT, "out", kind, stamp));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
