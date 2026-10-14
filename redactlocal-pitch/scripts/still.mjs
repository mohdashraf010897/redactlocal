// Render still frames for review.
//   npm run still -- <CompositionId> <frame> [frame ...] [--out dir] [--sheet]
//   npm run still -- Video --shots --sheet       # one settled frame per shot (deliverable overview)
//   npm run still -- Video --cuts --sheet        # frames before, during and after every transition
//   npm run still -- --list                      # compositions, lengths and where each shot starts
//   npm run still -- Video 12s --captions        # with burned-in captions, as `render --captions` draws them
// Frames accept plain numbers, seconds ("2.5s") or "end". --sheet also writes one labelled contact sheet.
// Each run writes to a new folder (out/stills/<time>/) so image viewers never show a cached older still.
import fs from "node:fs";
import path from "node:path";
import { ROOT, buildSite, contactSheet, launch, listComps, openComp, parseArgs, runDir, serve, shoot } from "./lib.mjs";
import { DEFAULT_VOICE, captionCues, narrate } from "./voice/narrate.mjs";

const { pos, opt } = parseArgs(process.argv.slice(2));
await buildSite().then(serve).then(async ({ server, url }) => {
  const browser = await launch();
  try {
    if (opt.list || !pos[0]) {
      for (const c of await listComps(browser, url)) {
        console.log(`${c.id}  ${c.width}x${c.height}  ${c.durationInFrames} frames (${(c.durationInFrames / c.fps).toFixed(1)}s)`);
        for (const s of c.shots ?? []) console.log(`    ${s.id.padEnd(14)} starts at frame ${String(s.start).padStart(5)}  (${(s.start / c.fps).toFixed(2)}s), ${s.len} frames`);
      }
      return;
    }
    const id = pos[0];
    const { page, meta } = await openComp(browser, url, id);
    if (opt.captions) {
      if (!meta.shots?.some((s) => s.say?.trim())) throw new Error("--captions needs a film whose shots have `say` lines");
      const voice = opt.voice ?? meta.narration?.voice ?? DEFAULT_VOICE, speed = Number(opt.speed ?? meta.narration?.speed ?? 1);
      const { clips } = await narrate(meta, { root: ROOT, voice, speed });
      await page.evaluate((c) => window.__deck.setCaptions(c), captionCues(clips));
    }
    const toFrame = (s) => s === "end" ? meta.durationInFrames - 1 : s.endsWith("s") ? Math.round(parseFloat(s) * meta.fps) : Number(s);
    const shots = meta.shots ?? [];
    if ((opt.shots || opt.cuts) && !shots.length) throw new Error(`--shots/--cuts need a film composition (e.g. Video), not "${id}"`);
    const label = new Map();
    let picks = pos.slice(1).map(toFrame);
    if (opt.shots) picks = shots.map((s) => { const f = s.start + Math.max(0, s.len - 40); label.set(f, s.id); return f; }); // settled: before any dip or handoff exit
    if (opt.cuts) picks = shots.slice(1).flatMap((s) => [-24, -8, 8, 24].map((d) => { label.set(s.start + d, `${s.id} ${d > 0 ? "+" : ""}${d}`); return s.start + d; }));
    const frames = (picks.length ? picks : [0]).map((f) => Math.max(0, Math.min(meta.durationInFrames - 1, f)));
    const dir = runDir("stills", opt.out);
    const files = [];
    for (const f of frames) {
      const file = path.join(dir, `${id}-${String(f).padStart(5, "0")}.png`);
      fs.writeFileSync(file, await shoot(page, f));
      files.push([f, file]);
      console.log(file);
    }
    if (opt.sheet && files.length > 1) {
      const items = files.map(([f, file]) => [file, `frame ${f} · ${(f / meta.fps).toFixed(2)}s${label.has(f) ? ` · ${label.get(f)}` : ""}`]);
      console.log(await contactSheet(browser, items, path.join(dir, `${id}-sheet.png`), { cols: opt.cuts ? 4 : undefined, aspect: meta.width / meta.height }));
    }
  } finally {
    await browser.close();
    server.close();
  }
});
