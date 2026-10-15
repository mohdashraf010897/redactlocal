// Narration check: speaks every shot's `say` line, reports whether each fits its shot, lists words
// it does not know, and writes the whole narration track to out/<Comp>-voice.wav for listening.
//   npm run voice -- [CompositionId] [--voice af_heart] [--speed 1]
//   npm run voice -- --say "Any sentence to try" [--voice am_michael]   (writes out/say.wav)
//   npm run voice -- --voices
import fs from "node:fs";
import path from "node:path";
import { ROOT, buildSite, launch, listComps, parseArgs, serve } from "./lib.mjs";
import { VOICES } from "./voice/assets.mjs";
import { RATE, Speaker, toPhonemes, toWav } from "./voice/kokoro.mjs";
import { DEFAULT_VOICE, fitReport, mix, narrate, readPronunciations } from "./voice/narrate.mjs";

const { pos, opt } = parseArgs(process.argv.slice(2));
const outDir = path.join(ROOT, "out");
fs.mkdirSync(outDir, { recursive: true });

function printUnknown(words, spelled = []) {
  if (spelled.length) console.log(`\nRead as letters (fine for acronyms; add to pronounce.json if not): ${spelled.join(", ")}`);
  if (!words.length) return;
  console.log(`\nNot in the dictionary (spelled out letter by letter): ${words.join(", ")}`);
  console.log(`Add them to pronounce.json as sound-alike words or phonemes, e.g. { "${words[0]}": "sound alike words" }`);
}

if (opt.voices) {
  console.log(`Voices (a = American, b = British; f = female, m = male). Default: ${DEFAULT_VOICE}\n  ${VOICES.join("\n  ")}`);
} else if (typeof opt.say === "string") {
  const { phonemes, unknown, spelled } = await toPhonemes(opt.say, readPronunciations(ROOT));
  console.log(`phonemes: ${phonemes}`);
  const speaker = await Speaker.load();
  const audio = await speaker.speak(phonemes, opt.voice ?? DEFAULT_VOICE, Number(opt.speed ?? 1));
  const file = path.join(outDir, "say.wav");
  fs.writeFileSync(file, toWav(audio));
  console.log(`${(audio.length / RATE).toFixed(1)}s -> ${file}`);
  printUnknown(unknown, spelled);
} else {
  const { server, url } = await buildSite().then(serve);
  const browser = await launch();
  let comps;
  try { comps = await listComps(browser, url); } finally { await browser.close(); server.close(); }
  const meta = pos[0] ? comps.find((c) => c.id === pos[0]) : comps.find((c) => c.shots?.some((s) => s.say));
  if (!meta) throw new Error(pos[0] ? `Unknown composition "${pos[0]}"` : "No film has narration yet. Add `say` to its shots.");
  const voice = opt.voice ?? meta.narration?.voice ?? DEFAULT_VOICE;
  const speed = Number(opt.speed ?? meta.narration?.speed ?? 1);
  console.log(`Narration for ${meta.id} (voice ${voice}, speed ${speed}):`);
  const { clips, unknown, spelled } = await narrate(meta, { root: ROOT, voice, speed });
  if (!clips.length) console.log("  no shot has a `say` line");
  const ok = fitReport(clips, meta.fps);
  const file = path.join(outDir, `${meta.id}-voice.wav`);
  fs.writeFileSync(file, toWav(mix(clips, meta.durationInFrames, meta.fps)));
  console.log(`\nNarration track -> ${file}`);
  printUnknown(unknown, spelled);
  if (!ok) { console.log("\nSome lines do not fit. Lengthen those shots or shorten the lines, then run this again."); process.exitCode = 1; }
}
