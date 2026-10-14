// Narration for a film: speaks each shot's `say` line, caches the audio, checks it fits the shot,
// and mixes everything into one track the length of the film.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { KOKORO_REV } from "./assets.mjs";
import { RATE, Speaker, fromWav, toPhonemes, toWav } from "./kokoro.mjs";

export const DEFAULT_VOICE = "af_heart";
export const SAY_AT = 10; // frames after a shot's content starts before its line begins
const TAIL = 12; // frames of quiet to leave after a line before its shot ends
const THIN = 0.55; // a line filling less of its shot than this leaves the scene feeling silent

// Project pronunciations: { "Heimdall": "hˈImdɑl", "kubectl": "cube control" }. Keys match any capitalisation.
export function readPronunciations(root) {
  const file = path.join(root, "pronounce.json");
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
}

export async function narrate(meta, { root, voice = DEFAULT_VOICE, speed = 1 }) {
  const lines = (meta.shots ?? []).filter((s) => s.say?.trim());
  const overrides = readPronunciations(root);
  const cacheDir = path.join(root, ".deck", "voice");
  fs.mkdirSync(cacheDir, { recursive: true });
  let speaker = null;
  const unknown = new Set(), spelled = new Set();
  const clips = [];
  for (const s of lines) {
    const { phonemes, unknown: miss, spelled: letters } = await toPhonemes(s.say, overrides);
    miss.forEach((w) => unknown.add(w));
    letters.forEach((w) => spelled.add(w));
    const key = crypto.createHash("sha1").update(JSON.stringify([KOKORO_REV, voice, speed, phonemes])).digest("hex").slice(0, 16);
    const file = path.join(cacheDir, `${key}.wav`);
    let samples;
    if (fs.existsSync(file)) samples = fromWav(fs.readFileSync(file));
    else {
      if (!speaker) { console.log("Loading the voice model ..."); speaker = await Speaker.load(); }
      samples = await speaker.speak(phonemes, voice, speed);
      fs.writeFileSync(file, toWav(samples));
    }
    const at = s.start + (s.sayAt ?? SAY_AT);
    clips.push({ id: s.id, say: s.say, at, end: s.start + s.len, samples, frames: Math.ceil((samples.length / RATE) * meta.fps), sayAt: s.sayAt ?? SAY_AT, len: s.len });
  }
  return { clips, unknown: [...unknown], spelled: [...spelled] };
}

// One line per shot: how long the speech is and whether the shot holds it. Returns false if any line
// is too long (must fix). "thin" lines fit but leave most of the shot silent (worth extending).
export function fitReport(clips, fps) {
  const rows = clips.map((c, i) => {
    const next = clips[i + 1];
    const overlap = next ? c.at + c.frames + TAIL - next.at : 0; // > 0: would talk over the next line
    const overlaps = overlap > 0;
    // Lengthening this shot pushes every later line back by the same amount.
    const need = Math.max(c.sayAt + c.frames + TAIL, overlaps ? c.len + overlap : 0);
    const ok = need <= c.len;
    const room = c.len - c.sayAt - TAIL;
    const wordsPerFrame = c.say.trim().split(/\s+/).length / c.frames;
    const spare = Math.floor((room * 0.8 - c.frames) * wordsPerFrame);
    return { ...c, need, ok, overlaps, thin: ok && c.frames < room * THIN && spare >= 3, spare };
  });
  const sec = (f) => `${(f / fps).toFixed(1)}s`;
  for (const r of rows) {
    const note = !r.ok ? (r.overlaps ? `runs into the next line: set len >= ${r.need}` : `too long: set len >= ${r.need}`)
      : r.thin ? `thin: room for about ${r.spare} more words` : "fits";
    const tag = !r.ok ? "FIX " : r.thin ? "thin" : "ok  ";
    console.log(`  ${tag} ${r.id.padEnd(14)} speech ${sec(r.frames).padStart(5)} in a ${sec(r.len).padStart(5)} shot  ${note}`);
  }
  return rows.every((r) => r.ok);
}

// Mixes the clips at their start frames into a track exactly `frames` long, peak-normalised.
export function mix(clips, frames, fps) {
  const out = new Float32Array(Math.round((frames / fps) * RATE));
  for (const c of clips) {
    const at = Math.round((c.at / fps) * RATE);
    for (let i = 0; i < c.samples.length && at + i < out.length; i++) out[at + i] += c.samples[i];
  }
  let peak = 0;
  for (const v of out) peak = Math.max(peak, Math.abs(v));
  if (peak > 0) { const g = 0.89 / peak; for (let i = 0; i < out.length; i++) out[i] *= g; }
  return out;
}

// Caption cues from the spoken lines: each line is split into short phrases (about one line on screen,
// breaking after punctuation where possible), timed across the line's speech in proportion to their length.
export function captionCues(clips, max = 48) {
  const cues = [];
  for (const c of clips) {
    const chunks = [];
    let cur = "";
    for (const w of c.say.trim().split(/\s+/)) {
      const next = cur ? `${cur} ${w}` : w;
      if (next.length > max && cur) { chunks.push(cur); cur = w; }
      else { cur = next; if (/[.,;:?!—]$/.test(w) && cur.length >= max * 0.45) { chunks.push(cur); cur = ""; } }
    }
    if (cur) chunks.push(cur);
    const total = chunks.reduce((n, s) => n + s.length, 0);
    let at = c.at;
    chunks.forEach((text, i) => {
      const to = i === chunks.length - 1 ? c.at + c.frames : Math.round(at + (c.frames * text.length) / total);
      cues.push({ from: Math.round(at), to, text });
      at = to;
    });
  }
  return cues;
}

// SubRip (.srt) captions, for players and platforms that show their own subtitles.
export function toSrt(cues, fps) {
  const ts = (f) => {
    const ms = Math.round((f / fps) * 1000);
    const p = (n, w = 2) => String(n).padStart(w, "0");
    return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
  };
  return cues.map((c, i) => `${i + 1}\n${ts(c.from)} --> ${ts(c.to)}\n${c.text}\n`).join("\n");
}
