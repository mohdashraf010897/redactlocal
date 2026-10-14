// Text -> 24 kHz mono speech with Kokoro-82M, run locally on onnxruntime-web (WebAssembly).
import fs from "node:fs";
import { Lexicon, phonemize } from "./g2p.mjs";
import { dictionaryFiles, loadOrt, modelFiles, voiceFile } from "./assets.mjs";

export const RATE = 24000;
const MAX_TOKENS = 510; // the model's context; longer lines are split by sentence, then by comma

let lexicon = null;
export async function getLexicon() {
  if (!lexicon) {
    const { gold, silver } = await dictionaryFiles();
    lexicon = new Lexicon(gold, silver);
  }
  return lexicon;
}

export async function toPhonemes(text, overrides = {}) {
  return phonemize(text, await getLexicon(), overrides);
}

export class Speaker {
  static async load() {
    const ort = await loadOrt();
    ort.env.wasm.numThreads = 4;
    ort.env.logLevel = "error";
    const { model, tokenizer } = await modelFiles();
    const vocab = JSON.parse(fs.readFileSync(tokenizer, "utf8")).model.vocab;
    const session = await ort.InferenceSession.create(fs.readFileSync(model));
    return new Speaker(ort, session, vocab);
  }

  constructor(ort, session, vocab) {
    Object.assign(this, { ort, session, vocab, styles: new Map() });
  }

  async style(voice) {
    if (!this.styles.has(voice)) {
      const buf = fs.readFileSync(await voiceFile(voice));
      this.styles.set(voice, new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4));
    }
    return this.styles.get(voice);
  }

  ids(phonemes) {
    return [...phonemes].map((c) => this.vocab[c]).filter((x) => x != null);
  }

  // Splits phonemes at sentence ends, then commas, so each piece fits the model.
  chunks(phonemes) {
    if (this.ids(phonemes).length <= MAX_TOKENS) return [phonemes];
    for (const sep of [/(?<=[.!?…])\s+/, /(?<=[,;:—])\s+/, /\s+/]) {
      const parts = phonemes.split(sep);
      if (parts.length < 2) continue;
      const out = [];
      let cur = "";
      for (const p of parts) {
        const next = cur ? `${cur} ${p}` : p;
        if (cur && this.ids(next).length > MAX_TOKENS) { out.push(cur); cur = p; } else cur = next;
      }
      out.push(cur);
      if (out.every((c) => this.ids(c).length <= MAX_TOKENS)) return out;
    }
    throw new Error("a single phrase is too long to speak; add punctuation");
  }

  async speak(phonemes, voice, speed = 1) {
    const style = await this.style(voice);
    const pieces = [];
    for (const chunk of this.chunks(phonemes)) {
      const ids = this.ids(chunk);
      const n = Math.min(ids.length, MAX_TOKENS - 1);
      const T = this.ort.Tensor;
      const out = await this.session.run({
        input_ids: new T("int64", BigInt64Array.from([0, ...ids, 0].map(BigInt)), [1, ids.length + 2]),
        style: new T("float32", style.slice(n * 256, n * 256 + 256), [1, 256]),
        speed: new T("float32", new Float32Array([speed]), [1]),
      });
      pieces.push(trimEnd(out[this.session.outputNames[0]].data));
    }
    return concat(pieces);
  }
}

// Drops trailing near-silence so the measured length is the length a listener hears.
function trimEnd(a) {
  let end = a.length;
  while (end > 0 && Math.abs(a[end - 1]) < 0.003) end--;
  return a.subarray(0, Math.min(a.length, end + Math.round(RATE * 0.05)));
}

function concat(parts) {
  const out = new Float32Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) { out.set(p, at); at += p.length; }
  return out;
}

export function toWav(samples, rate = RATE) {
  const b = Buffer.alloc(44 + samples.length * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + samples.length * 2, 4); b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(rate, 24);
  b.writeUInt32LE(rate * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write("data", 36); b.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(samples[i] * 32767))), 44 + i * 2);
  return b;
}

export function fromWav(buf) {
  const n = buf.readUInt32LE(40) / 2, out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = buf.readInt16LE(44 + i * 2) / 32767;
  return out;
}
