// Narration assets, fetched once on first use and shared by every project on this machine:
//   ~/.cache/motion-deck/ (or MOTION_DECK_CACHE)
// Every file is pinned to an exact upstream commit and checked against its sha256, so an upstream
// change can never alter or break a render. To use an internal mirror, set MOTION_DECK_KOKORO_URL and
// MOTION_DECK_MISAKI_URL to base URLs laid out like the upstream ones below.
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

// Kokoro-82M v1.0 (Apache-2.0), ONNX export by onnx-community.
export const KOKORO_REV = "1939ad2a8e416c0acfeecc08a694d14ef25f2231";
const KOKORO_URL = process.env.MOTION_DECK_KOKORO_URL ?? `https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/${KOKORO_REV}`;
// misaki (Apache-2.0) US English pronunciation dictionaries.
const MISAKI_REV = "fba1236595f2d2bf21d414ba6e57d25256afada3";
const MISAKI_URL = process.env.MOTION_DECK_MISAKI_URL ?? `https://raw.githubusercontent.com/hexgrad/misaki/${MISAKI_REV}/misaki/data`;
// onnxruntime-web (MIT) runs the model on WebAssembly: no native binaries, same result on every OS.
const ORT_VERSION = "1.30.0";

const PINNED = {
  "onnx/model_quantized.onnx": "fbae9257e1e05ffc727e951ef9b9c98418e6d79f1c9b6b13bd59f5c9028a1478",
  "tokenizer.json": "77a02c8e164413299b4b4c403b14f8e0e1c1b727db4d46a09d6327b861060a34",
  "voices/af_heart.bin": "d583ccff3cdca2f7fae535cb998ac07e9fcb90f09737b9a41fa2734ec44a8f0b",
  "voices/am_michael.bin": "1d1f21dd8da39c30705cd4c75d039d265e9bc4a2a93ed09bc9e1b1225eb95ba1",
  "us_gold.json": "dc414872a49a28ae6c141463d502fd945f3b2fde040484fdc47d00cc4612686f",
  "us_silver.json": "de8f67be911bb6c659187b4a65fd966b6a30e56350e0f790d763210b053ac475",
};

// American (a*) and British (b*) English voices. Other voices are pinned by the commit only.
export const VOICES = ["af_heart", "af_alloy", "af_aoede", "af_bella", "af_jessica", "af_kore", "af_nicole", "af_nova", "af_river", "af_sarah", "af_sky",
  "am_adam", "am_echo", "am_eric", "am_fenrir", "am_liam", "am_michael", "am_onyx", "am_puck", "am_santa",
  "bf_alice", "bf_emma", "bf_isabella", "bf_lily", "bm_daniel", "bm_fable", "bm_george", "bm_lewis"];

export const CACHE = process.env.MOTION_DECK_CACHE ?? path.join(os.homedir(), ".cache", "motion-deck");

async function fetchPinned(url, file, sha) {
  if (fs.existsSync(file)) return file;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  process.stdout.write(`  downloading ${path.basename(file)} ... `);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed (${res.status}): ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const got = crypto.createHash("sha256").update(buf).digest("hex");
  if (sha && got !== sha) throw new Error(`checksum mismatch for ${url}\n  expected ${sha}\n  got      ${got}`);
  fs.writeFileSync(`${file}.part`, buf);
  fs.renameSync(`${file}.part`, file);
  console.log(`${(buf.length / 1e6).toFixed(1)} MB`);
  return file;
}

const kokoro = (rel) => fetchPinned(`${KOKORO_URL}/${rel}`, path.join(CACHE, "kokoro", KOKORO_REV, rel), PINNED[rel]);

export async function modelFiles() {
  return { model: await kokoro("onnx/model_quantized.onnx"), tokenizer: await kokoro("tokenizer.json") };
}

export function voiceFile(name) {
  if (!VOICES.includes(name)) throw new Error(`unknown voice "${name}". English voices: ${VOICES.join(", ")}`);
  return kokoro(`voices/${name}.bin`);
}

export async function dictionaryFiles() {
  const get = (name) => fetchPinned(`${MISAKI_URL}/${name}`, path.join(CACHE, "misaki", MISAKI_REV, name), PINNED[name]);
  return { gold: await get("us_gold.json"), silver: await get("us_silver.json") };
}

// Installed into the shared cache, not the project, so projects without narration stay small.
export async function loadOrt() {
  const dir = path.join(CACHE, `onnxruntime-web-${ORT_VERSION}`);
  const entry = path.join(dir, "node_modules", "onnxruntime-web", "dist", "ort.node.min.mjs");
  if (!fs.existsSync(entry)) {
    console.log(`  installing onnxruntime-web@${ORT_VERSION} into ${dir} (one time) ...`);
    fs.mkdirSync(dir, { recursive: true });
    const npm = process.platform === "win32" ? "npm.cmd" : "npm";
    execFileSync(npm, ["install", "--prefix", dir, "--no-audit", "--no-fund", "--loglevel=error", `onnxruntime-web@${ORT_VERSION}`], { stdio: "inherit", shell: process.platform === "win32" });
  }
  return import(pathToFileURL(entry).href);
}
