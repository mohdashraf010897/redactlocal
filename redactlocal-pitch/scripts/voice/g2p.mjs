// English text -> Kokoro phonemes. A dictionary-only port of misaki's English G2P
// (hexgrad/misaki, Apache-2.0): same lexicon, stress and suffix rules, with no espeak fallback and no
// part-of-speech tagger. Words it cannot find are reported so a pronunciation can be added.
// Adds clock times ("9 AM"), compound splitting ("runbook"), common tech names and sound-alike overrides.
// Derived from misaki by hexgrad (https://github.com/hexgrad/misaki). Licensed under the Apache License, Version 2.0:
// https://www.apache.org/licenses/LICENSE-2.0
import fs from "node:fs";

const PRIMARY = "ˈ", SECONDARY = "ˌ";
const VOWELS = new Set("AIOQWYaiuæɑɒɔəɛɜɪʊʌᵻ");
const CONSONANTS = new Set("bdfhjklmnpstvwzðŋɡɹɾʃʒʤʧθ");
const US_TAUS = new Set("AIOWYiuæɑəɛɪɹʊʌ");
const PUNCTS = new Set(';:,.!?—…"“”()');
const NON_QUOTE_PUNCTS = new Set(";:,.!?—…");
const SYMBOLS = { "%": "percent", "&": "and", "+": "plus", "@": "at" };
const ORDINALS = new Set(["st", "nd", "rd", "th"]);
const ASCII_WORD = /^[A-Za-z']+$/;

const hasStress = (ps) => ps.includes(PRIMARY) || ps.includes(SECONDARY);
const hasVowel = (ps) => [...ps].some((c) => VOWELS.has(c));

// Moves each stress mark to just before the next vowel.
function restress(ps) {
  const ips = [...ps].map((p, i) => [i, p]);
  for (const [i, p] of [...ips]) {
    if (p !== PRIMARY && p !== SECONDARY) continue;
    const j = ips.slice(i).find(([, v]) => VOWELS.has(v));
    if (j) ips[i] = [j[0] - 0.5, p];
  }
  return ips.sort((a, b) => a[0] - b[0]).map(([, p]) => p).join("");
}

export function applyStress(ps, stress) {
  if (stress == null || ps == null) return ps;
  if (stress < -1) return ps.replaceAll(PRIMARY, "").replaceAll(SECONDARY, "");
  if (stress === -1 || ((stress === 0 || stress === -0.5) && ps.includes(PRIMARY))) return ps.replaceAll(SECONDARY, "").replaceAll(PRIMARY, SECONDARY);
  if ([0, 0.5, 1].includes(stress) && !hasStress(ps)) return hasVowel(ps) ? restress(SECONDARY + ps) : ps;
  if (stress >= 1 && !ps.includes(PRIMARY) && ps.includes(SECONDARY)) return ps.replaceAll(SECONDARY, PRIMARY);
  if (stress > 1 && !hasStress(ps)) return hasVowel(ps) ? restress(PRIMARY + ps) : ps;
  return ps;
}

// --- numbers -----------------------------------------------------------------------------------
const ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split(" ");
const TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split(" ");
const SCALES = [[1e12, "trillion"], [1e9, "billion"], [1e6, "million"], [1e3, "thousand"]];
export function cardinal(n) {
  if (n < 0) return `minus ${cardinal(-n)}`;
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : "");
  if (n < 1000) return `${ONES[Math.floor(n / 100)]} hundred` + (n % 100 ? ` ${cardinal(n % 100)}` : "");
  for (const [v, name] of SCALES) if (n >= v) return `${cardinal(Math.floor(n / v))} ${name}` + (n % v ? ` ${cardinal(n % v)}` : "");
  return String(n);
}
const ORD = { one: "first", two: "second", three: "third", five: "fifth", eight: "eighth", nine: "ninth", twelve: "twelfth" };
export function ordinal(n) {
  const words = cardinal(n).split(/([ -])/);
  const last = words.pop();
  return words.join("") + (ORD[last] ?? (last.endsWith("y") ? `${last.slice(0, -1)}ieth` : `${last}th`));
}
function year(n) {
  if (n % 1000 < 10 && n % 1000 !== 0 && n >= 2000) return cardinal(n);
  const hi = Math.floor(n / 100), lo = n % 100;
  if (lo === 0) return n % 1000 === 0 ? cardinal(n) : `${cardinal(hi)} hundred`;
  return `${cardinal(hi)} ${lo < 10 ? `oh ${ONES[lo]}` : cardinal(lo)}`;
}
// Spoken words for a numeric token such as "42", "3.5", "2026", "1,200", "3rd".
export function numberWords(tok) {
  const m = /^(-?)([\d,]*\d)(?:\.(\d+))?([a-z']*)$/.exec(tok);
  if (!m) return null;
  const [, neg, int, frac, suffix] = m;
  const n = Number(int.replaceAll(",", ""));
  let words;
  if (ORDINALS.has(suffix) && !frac) words = ordinal(n);
  else if (!frac && !neg && int.length === 4 && !int.includes(",") && n >= 1100 && n < 2100) words = year(n);
  else words = cardinal(n) + (frac ? ` point ${[...frac].map((d) => ONES[+d]).join(" ")}` : "");
  return { words: (neg ? "minus " : "") + words, suffix: ORDINALS.has(suffix) ? "" : suffix };
}

// --- lexicon -----------------------------------------------------------------------------------
const capitalize = (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
function grow(d) {
  const e = {};
  for (const [k, v] of Object.entries(d)) {
    if (k.length < 2) continue;
    if (k === k.toLowerCase()) { if (k !== capitalize(k)) e[capitalize(k)] = v; }
    else if (k === capitalize(k)) e[k.toLowerCase()] = v;
  }
  return { ...e, ...d };
}

export class Lexicon {
  constructor(goldPath, silverPath) {
    this.golds = grow(JSON.parse(fs.readFileSync(goldPath, "utf8")));
    this.silvers = grow(JSON.parse(fs.readFileSync(silverPath, "utf8")));
  }

  has(w) { return Object.hasOwn(this.golds, w) || Object.hasOwn(this.silvers, w); }

  // Spells a word letter by letter ("AJO" -> "A J O"), stressing the last letter.
  spell(word) {
    const ps = [...word].filter((c) => /[A-Za-z]/.test(c)).map((c) => this.golds[c.toUpperCase()]);
    if (!ps.length || ps.some((p) => p == null)) return null;
    const parts = applyStress(ps.join(""), 0).split(SECONDARY);
    const last = parts.pop();
    return parts.length ? parts.join(SECONDARY) + PRIMARY + last : last;
  }

  lookup(word, stress, ctx) {
    if (word === word.toUpperCase() && !Object.hasOwn(this.golds, word)) word = word.toLowerCase();
    let ps = Object.hasOwn(this.golds, word) ? this.golds[word] : Object.hasOwn(this.silvers, word) ? this.silvers[word] : null;
    if (ps && typeof ps === "object") ps = ctx?.futureVowel == null && "None" in ps ? ps.None : ps.DEFAULT;
    if (ps == null) return this.spell(word);
    return applyStress(ps, stress);
  }

  known(word) {
    if (this.has(word) || word in SYMBOLS) return true;
    if (!ASCII_WORD.test(word)) return false;
    if (word.length === 1) return true;
    if (word === word.toUpperCase() && this.has(word.toLowerCase())) return true;
    return word.slice(1) === word.slice(1).toUpperCase(); // acronyms are spelled out
  }

  special(word, stress, ctx) {
    if (word in SYMBOLS) return this.lookup(SYMBOLS[word], null, ctx);
    if (word === "a" || word === "A") return "ɐ";
    if (["am", "Am", "AM"].includes(word)) return ctx.futureVowel == null || word !== "am" || stress > 0 ? this.golds.am : "ɐm";
    if (["an", "An", "AN"].includes(word)) return "ɐn";
    if (word === "I") return `${SECONDARY}I`;
    if (["to", "To"].includes(word)) return ctx.futureVowel == null ? this.golds.to : ctx.futureVowel ? "tʊ" : "tə";
    if (["in", "In"].includes(word)) return (ctx.futureVowel == null ? PRIMARY : "") + "ɪn";
    if (["the", "The"].includes(word)) return ctx.futureVowel === true ? "ði" : "ðə";
    if (/^vs\.?$/i.test(word)) return this.lookup("versus", null, ctx);
    if (["used", "Used", "USED"].includes(word)) return this.golds.used.DEFAULT;
    return null;
  }

  s(stem) {
    if (!stem) return null;
    if ("ptkfθ".includes(stem.at(-1))) return `${stem}s`;
    if ("szʃʒʧʤ".includes(stem.at(-1))) return `${stem}ᵻz`;
    return `${stem}z`;
  }
  stemS(word, stress, ctx) {
    if (word.length < 3 || !word.endsWith("s")) return null;
    let stem;
    if (!word.endsWith("ss") && this.known(word.slice(0, -1))) stem = word.slice(0, -1);
    else if ((word.endsWith("'s") || (word.length > 4 && word.endsWith("es") && !word.endsWith("ies"))) && this.known(word.slice(0, -2))) stem = word.slice(0, -2);
    else if (word.length > 4 && word.endsWith("ies") && this.known(`${word.slice(0, -3)}y`)) stem = `${word.slice(0, -3)}y`;
    else return null;
    return this.s(this.lookup(stem, stress, ctx));
  }
  ed(stem) {
    if (!stem) return null;
    if ("pkfθʃsʧ".includes(stem.at(-1))) return `${stem}t`;
    if (stem.at(-1) === "d") return `${stem}ᵻd`;
    if (stem.at(-1) !== "t") return `${stem}d`;
    if (stem.length < 2) return `${stem}ɪd`;
    if (US_TAUS.has(stem.at(-2))) return `${stem.slice(0, -1)}ɾᵻd`;
    return `${stem}ᵻd`;
  }
  stemEd(word, stress, ctx) {
    if (word.length < 4 || !word.endsWith("d")) return null;
    let stem;
    if (!word.endsWith("dd") && this.known(word.slice(0, -1))) stem = word.slice(0, -1);
    else if (word.length > 4 && word.endsWith("ed") && !word.endsWith("eed") && this.known(word.slice(0, -2))) stem = word.slice(0, -2);
    else return null;
    return this.ed(this.lookup(stem, stress, ctx));
  }
  ing(stem) {
    if (!stem) return null;
    if (stem.length > 1 && stem.at(-1) === "t" && US_TAUS.has(stem.at(-2))) return `${stem.slice(0, -1)}ɾɪŋ`;
    return `${stem}ɪŋ`;
  }
  stemIng(word, stress, ctx) {
    if (word.length < 5 || !word.endsWith("ing")) return null;
    let stem;
    if (word.length > 5 && this.known(word.slice(0, -3))) stem = word.slice(0, -3);
    else if (this.known(`${word.slice(0, -3)}e`)) stem = `${word.slice(0, -3)}e`;
    else if (word.length > 5 && /([bcdgklmnprstvxz])\1ing$|cking$/.test(word) && this.known(word.slice(0, -4))) stem = word.slice(0, -4);
    else return null;
    return this.ing(this.lookup(stem, stress, ctx));
  }

  // Phonemes for one word, or null if it is not in the dictionary (and is not an acronym).
  word(raw, ctx) {
    let word = raw.replace(/[‘’]/g, "'").normalize("NFKC");
    const stress = word === word.toLowerCase() ? null : word === word.toUpperCase() ? 2 : 0.5;
    const sp = this.special(word, stress, ctx);
    if (sp != null) return sp;
    const wl = word.toLowerCase();
    if (word.length > 1 && word !== wl && !this.has(word) && (word === word.toUpperCase() || word.slice(1) === word.slice(1).toLowerCase())
      && (this.has(wl) || this.stemS(wl, stress, ctx) || this.stemEd(wl, stress, ctx) || this.stemIng(wl, stress, ctx))) word = wl;
    if (this.known(word)) return this.lookup(word, stress, ctx);
    if (word.endsWith("s'") && this.known(`${word.slice(0, -2)}'s`)) return this.lookup(`${word.slice(0, -2)}'s`, stress, ctx);
    if (word.endsWith("'") && this.known(word.slice(0, -1))) return this.lookup(word.slice(0, -1), stress, ctx);
    return this.stemS(word, stress, ctx) ?? this.stemEd(word, stress, ctx) ?? this.stemIng(word, stress ?? 0.5, ctx);
  }
}

// --- text -> tokens ------------------------------------------------------------------------------
// Splits text into words, numbers and punctuation. `[text](/phonemes/)` sets a word's phonemes directly.
const TOKEN = /\[([^\]]+)\]\(\/([^/)]+)\/\)|(\d{1,2})(?::(\d{2}))?\s?([AaPp])\.?\s?[Mm](?:\.(?=\s+[a-z]))?(?![A-Za-z])|(\d{1,2}):(\d{2})(?!\d)|\$?(?:(?<![A-Za-z\d])-)?\d(?:[\d,]*\d)?(?:\.\d+)?(?:st|nd|rd|th|s|'s)?|[A-Za-z]+(?:['’][A-Za-z]+)*|[%&+@]|[;:,.!?—…"“”()]|\s[-–]\s|./gsu;
function camelSplit(w) {
  return w.split(/(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/);
}

// "runbook" -> "run" + "book": split an unknown word into two dictionary words (each 3+ letters).
function compound(w, lexicon, ctx) {
  for (let i = w.length - 3; i >= 3; i--) {
    const a = lexicon.word(w.slice(0, i), ctx), b = lexicon.word(w.slice(i), ctx);
    if (a != null && b != null) return `${a}${b.replace(/ˈ/g, "ˌ")}`;
  }
  return null;
}

// "3 AM", "3:30pm", "9:05 a.m.", "14:00" -> spoken clock time.
function clock(h, mm, ap, space) {
  const words = cardinal(+h).split(/[ -]/);
  const min = mm == null ? 0 : +mm;
  if (min > 0) words.push(...(min < 10 ? ["oh", cardinal(min)] : cardinal(min).split(/[ -]/)));
  else if (!ap) words.push("o'clock");
  const out = words.map((w) => ({ text: w, space: true, num: true }));
  if (ap) out.push({ text: ap.toUpperCase() + "M", ps: ap.toLowerCase() === "a" ? "ˌAˈɛm" : "pˌiˈɛm", space });
  else out.at(-1).space = space;
  return out;
}

export function tokenize(text) {
  const out = [];
  let m;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(text))) {
    const t = m[0], space = /\s/.test(text[TOKEN.lastIndex] ?? " ") || TOKEN.lastIndex >= text.length;
    if (m[1]) { out.push({ text: m[1], ps: m[2], space }); continue; }
    if (m[3] || m[6]) { out.push(...clock(m[3] ?? m[6], m[4] ?? m[7], m[5], space)); continue; }
    if (/^\s[-–]\s$/.test(t)) { out.push({ text: "—", ps: "—", space: true }); continue; }
    if (/^\s$/.test(t)) { if (out.length) out.at(-1).space = true; continue; }
    if (t === "." && /\S/.test(text[m.index - 1] ?? " ") && /\S/.test(text[m.index + 1] ?? " ")) { out.push({ text: "dot", space: true }); continue; }
    if (PUNCTS.has(t)) { out.push({ text: t, ps: t, space }); continue; }
    if (/^\$?-?\d/.test(t)) {
      const dollars = t.startsWith("$");
      const nw = numberWords(dollars ? t.slice(1) : t);
      if (nw) {
        const words = `${nw.words}${dollars ? (nw.words === "one" ? " dollar" : " dollars") : ""}`.split(/[ -]/);
        words.forEach((w, i) => out.push({ text: w, space: i < words.length - 1 || space, num: true }));
        if (nw.suffix) out.at(-1).suffix = nw.suffix;
        continue;
      }
    }
    if (/^[A-Za-z]/.test(t) || t in SYMBOLS) { out.push({ text: t, space }); continue; }
    // anything else (slashes, hyphens inside words, emoji) is a soft word break
    if (out.length) out.at(-1).space = true;
  }
  return out;
}

// Tech names the dictionary lacks. A project's pronounce.json overrides these.
export const BUILT_IN = {
  kubernetes: "kˌubəɹnˈɛtiz", kubectl: "cube control", jira: "ʤˈiɹə", grafana: "ɡɹəfˈɑnə", splunk: "splˈʌŋk",
  nginx: "engine x", postgres: "pˈOstɡɹɛs", redis: "ɹˈɛdɪs", kafka: "kˈɑfkə", json: "ʤˈAsən", yaml: "jˈæməl",
  retrigger: "ɹitɹˈɪɡəɹ", retriggers: "ɹitɹˈɪɡəɹz", retriggered: "ɹitɹˈɪɡəɹd",
};
const SPELL_MAX = 4; // unknown words this short are taken as acronyms ("ajo") and reported as spelled, not unknown

// Single capital letters in a row ("V A seven") are letters, so "A" is not the article there.
function markLetters(toks, lexicon) {
  const letter = (t) => t && t.ps == null && /^[A-Z]$/.test(t.text);
  toks.forEach((tk, i) => {
    if (tk.text === "A" && tk.ps == null && (letter(toks[i - 1]) || letter(toks[i + 1]))) tk.ps = lexicon.spell("A");
  });
}

export function phonemize(text, lexicon, extra = {}) {
  const toks = tokenize(text);
  markLetters(toks, lexicon);
  const unknown = [], spelled = [];
  const table = {};
  for (const [k, v] of Object.entries({ ...BUILT_IN, ...extra })) table[k.toLowerCase()] = v;
  let ctx = { futureVowel: null };
  for (let i = toks.length - 1; i >= 0; i--) {
    const tk = toks[i];
    if (tk.ps == null) {
      const poss = /^(.+?)('s|s')$/i.exec(tk.text);
      // Override values are Kokoro phonemes when they carry a stress mark, else sound-alike words.
      const lookup = (w) => {
        const v = extra[w] ?? table[w.toLowerCase()];
        if (v == null) return null;
        if (/[ˈˌ]/.test(v)) return v;
        const r = phonemize(v, lexicon);
        [...r.unknown, ...r.spelled].forEach((u) => unknown.push(`${u} (in pronounce.json "${w}": "${v}")`));
        return r.phonemes.replace(/[.,!?;:]+$/, "");
      };
      const override = lookup(tk.text) ?? (poss && lookup(poss[1]) != null ? lexicon.s(lookup(poss[1])) : null);
      if (override != null) tk.ps = override;
      else {
        tk.ps = lexicon.word(tk.text, ctx);
        if (tk.ps == null) {
          const parts = camelSplit(tk.text);
          const sub = parts.length > 1 ? parts.map((p) => lexicon.word(p, ctx)) : [];
          if (sub.length && sub.every((p) => p != null)) tk.ps = sub.join(" ");
          else tk.ps = compound(tk.text, lexicon, ctx);
          if (tk.ps == null) {
            const letters = tk.text.replace(/[^A-Za-z]/g, "");
            (letters.length <= SPELL_MAX ? spelled : unknown).push(tk.text);
            tk.ps = lexicon.spell(tk.text) ?? "";
          }
        }
      }
      if (tk.suffix === "s" || tk.suffix === "'s") tk.ps = lexicon.s(tk.ps);
    }
    const first = [...tk.ps].find((c) => VOWELS.has(c) || CONSONANTS.has(c) || NON_QUOTE_PUNCTS.has(c));
    if (first) ctx = { futureVowel: NON_QUOTE_PUNCTS.has(first) ? null : VOWELS.has(first) };
  }
  let out = "";
  const isPunct = (t) => PUNCTS.has(t.ps);
  toks.forEach((tk, i) => {
    out += tk.ps;
    const next = toks[i + 1];
    if (next && (tk.space || (!isPunct(tk) && !isPunct(next)))) out += " ";
  });
  // Kokoro v1.0 uses T and t where misaki v2 writes ɾ and ʔ.
  return { phonemes: out.replace(/ +/g, " ").trim().replaceAll("ɾ", "T").replaceAll("ʔ", "t"), unknown: [...new Set(unknown)], spelled: [...new Set(spelled)] };
}
