// Pull frames out of a reference video (an earlier cut, a screen recording) to compare against. No ffmpeg:
// it plays the file in the same Chrome or Edge the renderer uses.
//   npm run frames -- old.mp4 --every 2 --sheet        # a frame every 2 s, plus a labelled contact sheet
//   npm run frames -- old.mp4 --at 3,7.5,12 --sheet    # frames at those seconds
// Writes PNGs to out/frames/<time>/ inside the project.
import fs from "node:fs";
import path from "node:path";
import { contactSheet, launch, parseArgs, runDir, serve } from "./lib.mjs";

const { pos, opt } = parseArgs(process.argv.slice(2));
const file = pos[0] && path.resolve(pos[0]);
if (!file || !fs.existsSync(file)) {
  console.error("Usage: npm run frames -- <video.mp4> [--every 2 | --at 3,7.5] [--sheet] [--out dir]");
  process.exit(1);
}
const { server, url } = await serve(path.dirname(file));
const browser = await launch();
try {
  const page = await browser.newPage();
  await page.goto(url + encodeURIComponent(path.basename(file))); // Chrome wraps a video URL in a page with one <video>
  const meta = await page.evaluate(() => new Promise((ok, fail) => {
    const v = document.querySelector("video");
    const done = () => ok({ w: v.videoWidth, h: v.videoHeight, dur: v.duration });
    if (!v) return fail(new Error("This browser cannot open the video (try Google Chrome)."));
    v.pause(); v.muted = true;
    if (v.readyState >= 1) done(); else { v.onloadedmetadata = done; v.onerror = () => fail(new Error("This browser cannot decode the video (try Google Chrome).")); }
  }));
  const times = opt.at ? String(opt.at).split(",").map(Number) : Array.from({ length: Math.floor(meta.dur / Number(opt.every ?? 2)) + 1 }, (_, i) => i * Number(opt.every ?? 2));
  const dir = runDir("frames", opt.out);
  const items = [];
  for (const t of times.map((x) => Math.min(x, Math.max(0, meta.dur - 0.05)))) {
    const png = await page.evaluate((at) => new Promise((ok) => {
      const v = document.querySelector("video");
      v.onseeked = () => {
        const c = document.createElement("canvas");
        c.width = v.videoWidth; c.height = v.videoHeight;
        c.getContext("2d").drawImage(v, 0, 0);
        ok(c.toDataURL("image/png").split(",")[1]);
      };
      v.currentTime = at;
    }), t);
    const out = path.join(dir, `${path.parse(file).name}-${t.toFixed(2).padStart(6, "0")}s.png`);
    fs.writeFileSync(out, Buffer.from(png, "base64"));
    items.push([out, `${t.toFixed(2)}s`]);
    console.log(out);
  }
  console.log(`${meta.w}x${meta.h}, ${meta.dur.toFixed(1)} s, ${items.length} frames`);
  if (opt.sheet && items.length > 1) console.log(await contactSheet(browser, items, path.join(dir, "sheet.png"), { cols: items.length > 9 ? 4 : undefined, aspect: meta.w / meta.h }));
} finally {
  await browser.close();
  server.close();
}
