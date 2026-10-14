// Render a composition to MP4. Frames are captured in parallel headless pages, encoded to H.264
// inside the browser (WebCodecs) and written to MP4 by mp4.mjs. No ffmpeg needed.
// Shots with a `say` line get local narration (scripts/voice/), encoded to AAC the same way.
//   npm run render -- <CompositionId> [out.mp4] [--from N] [--to N] [--workers N] [--mbps 12]
//                     [--mute] [--voice af_heart] [--speed 1] [--captions]
// --captions burns the narration in as on-screen captions and writes <out>.srt next to the MP4.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ROOT, buildSite, launch, listComps, openComp, parseArgs, serve, shoot } from "./lib.mjs";
import { buildMp4 } from "./mp4.mjs";
import { reportRender } from "./usage.mjs";
import { RATE } from "./voice/kokoro.mjs";
import { DEFAULT_VOICE, captionCues, fitReport, mix, narrate, toSrt } from "./voice/narrate.mjs";

const { pos, opt } = parseArgs(process.argv.slice(2));
const t0 = Date.now();

// Runs inside the browser page: configures a VideoEncoder and hands encoded chunks back to Node.
async function startEncoder(page, { width, height, fps, bitrate }) {
  const chunks = [];
  let config = null;
  await page.exposeFunction("__deckChunk", (b64, key, ts) => chunks.push({ data: Buffer.from(b64, "base64"), key, ts }));
  await page.exposeFunction("__deckConfig", (c) => { config = c; });
  const codec = await page.evaluate(async ({ width, height, fps, bitrate }) => {
    const level = width * height <= 1920 * 1088 && fps <= 30 ? "28" : "33"; // H.264 level 4.0 or 5.1
    const candidates = [`avc1.6400${level}`, `avc1.4D00${level}`, `avc1.4200${level}`];
    let picked = null;
    for (const codec of candidates) {
      const cfg = { codec, width, height, bitrate, framerate: fps, avc: { format: "avc" }, latencyMode: "quality" };
      if ((await VideoEncoder.isConfigSupported(cfg)).supported) { picked = cfg; break; }
    }
    if (!picked) return null;
    const toB64 = (u8) => { let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000)); return btoa(s); };
    const w = window;
    w.__deckEnc = new VideoEncoder({
      output: (chunk, meta) => {
        const dc = meta?.decoderConfig;
        if (dc?.description) {
          const d = dc.description;
          const bytes = d instanceof ArrayBuffer ? new Uint8Array(d) : new Uint8Array(d.buffer, d.byteOffset, d.byteLength);
          w.__deckConfig({ avcC: toB64(bytes), color: dc.colorSpace ?? null });
        }
        const buf = new Uint8Array(chunk.byteLength);
        chunk.copyTo(buf);
        w.__deckChunk(toB64(buf), chunk.type === "key", chunk.timestamp);
      },
      error: (e) => { w.__deckError = String(e); },
    });
    w.__deckEnc.configure(picked);
    w.__deckEncode = async (b64, i) => {
      if (w.__deckError) throw new Error(w.__deckError);
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const bmp = await createImageBitmap(new Blob([bytes], { type: "image/jpeg" }));
      const frame = new VideoFrame(bmp, { timestamp: Math.round((i * 1e6) / fps), duration: Math.round(1e6 / fps) });
      w.__deckEnc.encode(frame, { keyFrame: i % (fps * 2) === 0 });
      frame.close(); bmp.close();
      while (w.__deckEnc.encodeQueueSize > 6) await new Promise((r) => setTimeout(r, 2));
    };
    return picked.codec;
  }, { width, height, fps, bitrate });
  if (!codec) throw new Error("This browser cannot encode H.264. Use Google Chrome or Microsoft Edge (or set DECK_BROWSER).");
  return {
    codec,
    encode: (jpeg, i) => page.evaluate(([b64, n]) => window.__deckEncode(b64, n), [jpeg.toString("base64"), i]),
    finish: async () => {
      await page.evaluate(async () => { await window.__deckEnc.flush(); if (window.__deckError) throw new Error(window.__deckError); });
      await new Promise((r) => setTimeout(r, 50)); // let the last exposed-function calls land
      if (!config) throw new Error("encoder produced no configuration");
      return { chunks, config };
    },
  };
}

// Resamples the 24 kHz narration to 48 kHz (the rate browsers encode AAC at) and encodes it in the page.
async function encodeAudio(page, pcm) {
  const b64 = Buffer.from(pcm.buffer, pcm.byteOffset, pcm.byteLength).toString("base64");
  const res = await page.evaluate(async ({ b64, rate }) => {
    const OUT = 48000;
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const src = new Float32Array(bytes.buffer);
    const ctx = new OfflineAudioContext(1, Math.ceil((src.length * OUT) / rate), OUT);
    const buf = ctx.createBuffer(1, src.length, rate);
    buf.copyToChannel(src, 0);
    const node = ctx.createBufferSource();
    node.buffer = buf; node.connect(ctx.destination); node.start();
    const pcm = (await ctx.startRendering()).getChannelData(0);
    const cfg = { codec: "mp4a.40.2", sampleRate: OUT, numberOfChannels: 1, bitrate: 128000 };
    if (!(await AudioEncoder.isConfigSupported(cfg)).supported) return { error: "This browser cannot encode AAC audio. Use Google Chrome or Microsoft Edge, or render with --mute." };
    const toB64 = (u8) => { let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000)); return btoa(s); };
    const chunks = [];
    let asc = null, error = null;
    const enc = new AudioEncoder({
      output: (chunk, meta) => {
        const d = meta?.decoderConfig?.description;
        if (d && !asc) asc = toB64(d instanceof ArrayBuffer ? new Uint8Array(d) : new Uint8Array(d.buffer, d.byteOffset, d.byteLength));
        const b = new Uint8Array(chunk.byteLength); chunk.copyTo(b); chunks.push(toB64(b));
      },
      error: (e) => { error = String(e); },
    });
    enc.configure(cfg);
    const STEP = 4800;
    for (let i = 0; i < pcm.length; i += STEP) {
      const data = pcm.slice(i, i + STEP);
      enc.encode(new AudioData({ format: "f32", sampleRate: OUT, numberOfFrames: data.length, numberOfChannels: 1, timestamp: Math.round((i * 1e6) / OUT), data }));
    }
    await enc.flush();
    return { error, asc, chunks, sampleRate: OUT };
  }, { b64, rate: RATE });
  if (res.error) throw new Error(res.error);
  if (!res.asc) throw new Error("audio encoder produced no configuration");
  return { sampleRate: res.sampleRate, channels: 1, asc: Buffer.from(res.asc, "base64"), samples: res.chunks.map((c) => Buffer.from(c, "base64")) };
}

await buildSite().then(serve).then(async ({ server, url }) => {
  const browser = await launch();
  try {
    const id = pos[0] ?? (await listComps(browser, url))[0].id;
    const out = path.resolve(pos[1] ?? path.join(ROOT, "out", `${id}.mp4`));
    fs.mkdirSync(path.dirname(out), { recursive: true });

    const { page: first, meta } = await openComp(browser, url, id);
    const from = Math.max(0, Number(opt.from ?? 0));
    const to = Math.min(Number(opt.to ?? meta.durationInFrames), meta.durationInFrames);
    const total = to - from;
    if (total <= 0) throw new Error(`nothing to render: --from ${from} --to ${to}`);
    if (meta.width % 2 || meta.height % 2) throw new Error("width and height must be even for H.264");
    const workers = Math.max(1, Math.min(Number(opt.workers ?? Math.max(1, Math.floor(os.cpus().length / 2))), 8, total));
    const bitrate = Math.round(Number(opt.mbps ?? 12) * 1e6);

    // Narration first: it is quick when cached, and a missing model or a bad line fails before the long capture.
    // Captions are timed from the same speech, so they need it too (even with --mute).
    const full = from === 0 && to === meta.durationInFrames;
    const hasSay = meta.shots?.some((s) => s.say?.trim());
    if (opt.captions && !hasSay) throw new Error("--captions needs narration: give the shots `say` lines (the captions are made from them).");
    const speak = !opt.mute && hasSay && full;
    if (!opt.mute && hasSay && !full) console.log("Partial render: narration skipped (render the whole film to hear it).");
    let narration = null, cues = null;
    if (speak || opt.captions) {
      const voice = opt.voice ?? meta.narration?.voice ?? DEFAULT_VOICE;
      const speed = Number(opt.speed ?? meta.narration?.speed ?? 1);
      console.log(`Narration: voice ${voice}${opt.captions ? ", with captions" : ""}`);
      const { clips, unknown } = await narrate(meta, { root: ROOT, voice, speed });
      if (!fitReport(clips, meta.fps)) console.log("  Warning: some lines do not fit their shots (see above). Run `npm run voice` for details.");
      if (unknown.length) console.log(`  Spelled out letter by letter: ${unknown.join(", ")} (add them to pronounce.json)`);
      if (speak) narration = mix(clips, meta.durationInFrames, meta.fps);
      if (opt.captions) cues = captionCues(clips);
    }

    const encPage = await browser.newPage();
    await encPage.goto(url);
    const enc = await startEncoder(encPage, { width: meta.width, height: meta.height, fps: meta.fps, bitrate });
    console.log(`Rendering ${id}: frames ${from}-${to - 1} (${(total / meta.fps).toFixed(1)}s), ${workers} workers, ${enc.codec}`);

    // Workers capture contiguous ranges; the encoder consumes frames strictly in order.
    const ready = new Map();
    const waiters = new Map();
    const put = (f, buf) => { ready.set(f, buf); waiters.get(f)?.(); waiters.delete(f); };
    const take = (f) => (ready.has(f) ? Promise.resolve() : new Promise((r) => waiters.set(f, r))).then(() => { const b = ready.get(f); ready.delete(f); return b; });
    let next = from; // next frame the encoder needs; workers pause if they get too far ahead
    const per = Math.ceil(total / workers);
    const ranges = Array.from({ length: workers }, (_, w) => [from + w * per, Math.min(to, from + (w + 1) * per)]).filter(([a, b]) => b > a);
    const pages = [first, ...(await Promise.all(ranges.slice(1).map(() => openComp(browser, url, id).then((r) => r.page))))];
    if (cues) await Promise.all(pages.map((p) => p.evaluate((c) => window.__deck.setCaptions(c), cues)));

    const capture = Promise.all(ranges.map(async ([a, b], w) => {
      for (let f = a; f < b; f++) {
        while (f - next > 90 && ready.size > 60) await new Promise((r) => setTimeout(r, 5));
        put(f, await shoot(pages[w], f, "jpeg"));
      }
    }));
    const encode = (async () => {
      for (let f = from; f < to; f++) {
        const jpeg = await take(f);
        await enc.encode(jpeg, f - from);
        next = f + 1;
        if ((f - from + 1) % 30 === 0 || f === to - 1) process.stdout.write(`\r  ${f - from + 1}/${total} frames`);
      }
    })();
    await Promise.all([capture, encode]);
    const { chunks, config } = await enc.finish();
    process.stdout.write("\n");

    // Decode order must equal display order (no B-frames); the writer has no composition offsets.
    if (chunks.some((c, i) => i && c.ts <= chunks[i - 1].ts)) throw new Error("encoder reordered frames (B-frames); not supported");
    if (chunks.length !== total) throw new Error(`encoder returned ${chunks.length} frames, expected ${total}`);
    const avcC = Buffer.from(config.avcC, "base64");
    const audio = narration ? await encodeAudio(encPage, narration) : undefined;
    fs.writeFileSync(out, buildMp4({ width: meta.width, height: meta.height, fps: meta.fps, avcC, color: config.color, samples: chunks, audio }));
    if (cues && full) {
      const srt = out.replace(/\.mp4$/i, "") + ".srt";
      fs.writeFileSync(srt, toSrt(cues, meta.fps));
      console.log(`Captions -> ${srt}`);
    }
    console.log(`Done in ${((Date.now() - t0) / 1000).toFixed(0)}s -> ${out}`);
    if (full) reportRender({ durationS: total / meta.fps, narrated: Boolean(narration), renderMs: Date.now() - t0 });
  } finally {
    await browser.close();
    server.close();
  }
});
