import React from "react";
import { Easing, interpolate } from "../engine";
import { C, MONO, RADIUS, SHADOW, TYPE } from "./theme";
import { Rect } from "./ui";

// Code on screen: a highlighted code card that can type itself out and focus lines (CodeBlock), a diff
// that removes and adds lines (DiffBlock), and a morph from one version of a file to the next (CodeMorph).
// Paste real code from the repo; keep it short (about 12 to 18 lines at the default size).

export type Lang = "ts" | "js" | "py" | "go" | "java" | "rust" | "sh" | "yaml" | "json" | "sql" | "text";
type Tok = { text: string; kind: "kw" | "str" | "com" | "num" | "fn" | "type" | "plain" };

const KEYWORDS = new Set(("abstract as async await break case catch class const continue def default defer del delete do elif else enum export extends " +
  "false fn for from func function go if impl implements import in interface is lambda let match mod mut new nil None not null or package pass private " +
  "protected pub public raise readonly return select self static struct super switch this throw throws True False true try type typeof use var void where " +
  "while with yield SELECT FROM WHERE JOIN LEFT RIGHT INNER ON GROUP BY ORDER LIMIT INSERT INTO VALUES UPDATE SET DELETE CREATE TABLE AND OR NOT AS").split(" "));
const HASH_COMMENT = new Set<Lang>(["py", "sh", "yaml"]);

// Small, dependency-free highlighter: comments, strings, numbers, keywords, calls and types. Good enough for
// short snippets on screen; it does not parse.
export function tokenize(line: string, lang: Lang = "ts"): Tok[] {
  if (lang === "text") return [{ text: line, kind: "plain" }];
  const com = HASH_COMMENT.has(lang) ? "#.*" : lang === "sql" ? "--.*" : "\\/\\/.*|\\/\\*.*?\\*\\/";
  const re = new RegExp(`(${com})|("(?:\\\\.|[^"\\\\])*"?|'(?:\\\\.|[^'\\\\])*'?|\`(?:\\\\.|[^\`\\\\])*\`?)|(\\b\\d[\\d_.]*\\w*\\b)|([A-Za-z_$][\\w$]*)|(\\s+|.)`, "g");
  const out: Tok[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    const [t, c, s, n, w] = m;
    const isKey = (lang === "yaml" || lang === "json") && /^\s*:/.test(line.slice(re.lastIndex)); // "key": / key:
    let kind: Tok["kind"] = "plain";
    if (c) kind = "com";
    else if (isKey && (s || w)) kind = "fn";
    else if (s) kind = "str";
    else if (n) kind = "num";
    else if (w) kind = KEYWORDS.has(w) ? "kw" : line[re.lastIndex] === "(" ? "fn" : /^[A-Z][a-z]/.test(w) ? "type" : "plain";
    const last = out[out.length - 1];
    if (last && last.kind === kind && kind === "plain") last.text += t; else out.push({ text: t, kind });
  }
  return out;
}

// Default code size: larger than body text minimums because code is dense. Fits about 16 lines in a 900 px tall card.
export const CODE_SIZE = 28;
export const CODE = { kw: "#8A3FFC", str: "#1E7F4F", com: C.dim, num: C.blue, fn: "#B3471B", type: "#0F6D86", plain: C.ink };

const Line: React.FC<{ text: string; lang: Lang; chars?: number }> = ({ text, lang, chars = Infinity }) => {
  let left = chars;
  return (
    <>
      {tokenize(text, lang).map((t, i) => {
        if (left <= 0) return null;
        const shown = t.text.slice(0, Math.max(0, Math.floor(left)));
        left -= t.text.length;
        return <span key={i} style={{ color: CODE[t.kind], fontStyle: t.kind === "com" ? "italic" : undefined }}>{shown}</span>;
      })}
    </>
  );
};

const Frame: React.FC<{ r: Rect; title?: string; badge?: React.ReactNode; children: React.ReactNode }> = ({ r, title, badge, children }) => (
  <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, background: C.card, borderRadius: RADIUS * 0.6, boxShadow: SHADOW, overflow: "hidden", fontFamily: MONO, boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
    {title && (
      <div style={{ height: 56, flex: "none", display: "flex", alignItems: "center", gap: 14, padding: "0 24px", borderBottom: `1.5px solid ${C.line}`, background: "#FAF9F6", fontSize: TYPE.small, color: C.dim }}>
        <span style={{ color: C.ink }}>{title}</span>
        {badge && <span style={{ marginLeft: "auto" }}>{badge}</span>}
      </div>
    )}
    <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>{children}</div>
  </div>
);

// Code card. `typed` reveals that many characters across all lines (use typedChars from screens.tsx);
// `focus` lists 1-based line numbers to highlight and `focusT` (0..1) fades the highlight in and dims the
// rest. Step through a walkthrough by changing `focus` per beat. `scroll` (lines, may be fractional) moves
// the view down a longer file.
export const CodeBlock: React.FC<{
  r: Rect; code: string; lang?: Lang; title?: string; typed?: number; focus?: number[]; focusT?: number;
  firstLine?: number; lineNumbers?: boolean; fontSize?: number; scroll?: number; badge?: React.ReactNode;
}> = ({ r, code, lang = "ts", title, typed = Infinity, focus = [], focusT = 1, firstLine = 1, lineNumbers = true, fontSize = CODE_SIZE, scroll = 0, badge }) => {
  const lines = code.replace(/\n$/, "").split("\n");
  const lh = fontSize * 1.6;
  const gutter = lineNumbers ? String(firstLine + lines.length - 1).length * fontSize * 0.62 + 28 : 0;
  let left = typed;
  return (
    <Frame r={r} title={title} badge={badge}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 18 - scroll * lh, fontSize, lineHeight: `${lh}px`, whiteSpace: "pre" }}>
        {lines.map((text, i) => {
          if (left <= 0 && typed !== Infinity) return null;
          const chars = left;
          const typing = typed !== Infinity && left < text.length + 1 && left > 0;
          left -= text.length + 1;
          const n = firstLine + i;
          const on = focus.includes(n);
          const dim = focus.length ? (on ? 1 : 1 - 0.65 * focusT) : 1;
          return (
            <div key={i} style={{ position: "relative", display: "flex", height: lh, opacity: dim, background: on ? `rgba(255,90,31,${0.1 * focusT})` : undefined, boxShadow: on && focusT > 0 ? `inset 5px 0 0 rgba(255,90,31,${focusT})` : undefined }}>
              {lineNumbers && <span style={{ width: gutter, flex: "none", textAlign: "right", paddingRight: 20, boxSizing: "border-box", color: "#B8B4AC" }}>{n}</span>}
              <span style={{ paddingLeft: lineNumbers ? 4 : 28 }}>
                <Line text={text} lang={lang} chars={chars} />
                {typing && <span style={{ display: "inline-block", width: "0.55em", height: "1.1em", background: C.ink, verticalAlign: "text-bottom" }} />}
              </span>
            </div>
          );
        })}
      </div>
    </Frame>
  );
};

// ---- Diffs ----

export type DiffLine = { text: string; kind: "add" | "del" | "ctx" | "hunk"; old?: number; new?: number };
export type DiffFile = { file: string; additions: number; deletions: number; lines: DiffLine[] };

// Parses `git diff` / `gh pr diff` output into files and lines. Keep only the hunks you show on screen.
export function parseDiff(diff: string): DiffFile[] {
  const files: DiffFile[] = [];
  let f: DiffFile | null = null, o = 0, n = 0;
  for (const raw of diff.split("\n")) {
    if (raw.startsWith("diff --git")) { f = { file: raw.split(" b/").pop() ?? "", additions: 0, deletions: 0, lines: [] }; files.push(f); continue; }
    if (!f || raw.startsWith("--- ") || raw.startsWith("+++ ") || /^(index|new file|deleted file|similarity|rename|old mode|new mode)/.test(raw)) continue;
    const h = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@(.*)/.exec(raw);
    if (h) { o = +h[1]; n = +h[2]; f.lines.push({ kind: "hunk", text: h[3].trim() }); continue; }
    if (raw.startsWith("+")) { f.lines.push({ kind: "add", text: raw.slice(1), new: n++ }); f.additions++; }
    else if (raw.startsWith("-")) { f.lines.push({ kind: "del", text: raw.slice(1), old: o++ }); f.deletions++; }
    else if (raw.startsWith(" ") || raw === "") f.lines.push({ kind: "ctx", text: raw.slice(1), old: o++, new: n++ });
  }
  return files;
}

const ease = Easing.bezier(0.45, 0, 0.2, 1);
const seg = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

// Unified diff card. As `t` goes 0 -> 1: removed lines turn red and (unless `keepRemoved`) fold away in the
// first half, then added lines open up in green in the second half. At t = 0 it shows the old code.
export const DiffBlock: React.FC<{ r: Rect; lines: DiffLine[]; t: number; lang?: Lang; title?: string; keepRemoved?: boolean; fontSize?: number }> = ({ r, lines, t, lang = "ts", title, keepRemoved, fontSize = CODE_SIZE }) => {
  const lh = fontSize * 1.6;
  const del = seg(t, 0, 0.45), add = seg(t, 0.5, 1);
  const adds = lines.filter((l) => l.kind === "add").length, dels = lines.filter((l) => l.kind === "del").length;
  const badge = <span style={{ opacity: Math.max(del, add) }}><span style={{ color: C.green }}>+{adds}</span>{"  "}<span style={{ color: C.red }}>−{dels}</span></span>;
  return (
    <Frame r={r} title={title} badge={badge}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 14, fontSize, lineHeight: `${lh}px`, whiteSpace: "pre" }}>
        {lines.map((l, i) => {
          if (l.kind === "hunk") return <div key={i} style={{ height: lh, padding: "0 24px", color: C.dim, background: "#F3F1EC" }}>{l.text ? `@@ ${l.text}` : "@@"}</div>;
          const k = l.kind === "del" ? (keepRemoved ? 1 : 1 - seg(t, 0.25, 0.45)) : l.kind === "add" ? add : 1;
          const tint = l.kind === "del" ? del : l.kind === "add" ? add : 0;
          const bg = l.kind === "del" ? `rgba(229,72,77,${0.13 * tint})` : l.kind === "add" ? `rgba(48,164,108,${0.15 * tint})` : undefined;
          const mark = l.kind === "del" ? "−" : l.kind === "add" ? "+" : " ";
          return (
            <div key={i} style={{ height: lh * k, opacity: l.kind === "ctx" ? 1 : Math.min(1, k * 1.2), overflow: "hidden", background: bg, display: "flex" }}>
              <span style={{ width: 48, flex: "none", textAlign: "center", color: l.kind === "del" ? C.red : l.kind === "add" ? C.green : C.dim, opacity: tint || 1 }}>{l.kind === "ctx" ? "" : mark}</span>
              <span><Line text={l.text} lang={lang} /></span>
            </div>
          );
        })}
      </div>
    </Frame>
  );
};

// Longest common subsequence of lines: which old line becomes which new line.
function matchLines(a: string[], b: string[]): Map<number, number> {
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const m = new Map<number, number>();
  for (let i = 0, j = 0; i < a.length && j < b.length;) {
    if (a[i] === b[j]) { m.set(i, j); i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else j++;
  }
  return m;
}

// "Magic move" between two versions of the same code. As `t` goes 0 -> 1: lines that change fade out, kept
// lines slide to their new positions, and new lines fade in, flashing green as they land. Better than a
// diff when the point is the result ("the handler shrinks to three lines").
export const CodeMorph: React.FC<{ r: Rect; from: string; to: string; t: number; lang?: Lang; title?: string; fontSize?: number }> = ({ r, from, to, t, lang = "ts", title, fontSize = CODE_SIZE }) => {
  const a = from.replace(/\n$/, "").split("\n"), b = to.replace(/\n$/, "").split("\n");
  const keep = matchLines(a, b);
  const kept = new Set(keep.values());
  const lh = fontSize * 1.6;
  const out = seg(t, 0, 0.35), move = seg(t, 0.2, 0.75), inn = seg(t, 0.6, 1);
  const flash = interpolate(t, [0.6, 0.8, 1], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const row = (key: string, text: string, y: number, opacity: number, bg?: string) => (
    <div key={key} style={{ position: "absolute", left: 0, right: 0, top: y, height: lh, opacity, padding: "0 28px", background: bg }}><Line text={text} lang={lang} /></div>
  );
  return (
    <Frame r={r} title={title}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 18, fontSize, lineHeight: `${lh}px`, whiteSpace: "pre" }}>
        {a.map((text, i) => keep.has(i)
          ? row(`k${i}`, text, (i + (keep.get(i)! - i) * move) * lh, 1)
          : row(`o${i}`, text, i * lh, 1 - out, `rgba(229,72,77,${0.12 * (1 - out) * Math.min(1, t * 8)})`))}
        {b.map((text, j) => kept.has(j) ? null : row(`n${j}`, text, j * lh, inn, `rgba(48,164,108,${0.16 * flash})`))}
      </div>
    </Frame>
  );
};
