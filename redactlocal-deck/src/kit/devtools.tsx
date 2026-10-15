import React from "react";
import { C, FONT, MONO, RADIUS, SHADOW, TYPE } from "./theme";
import { Icon } from "./icons";
import { Rect } from "./ui";

// Engineering screens: a pull request page (PRView) and a terminal that replays a real or scripted session
// (TerminalReplay). No product logos; they read as "a code review tool" and "a shell".

export type Check = { name: string; result?: "pass" | "fail"; t?: number };
export type PR = { number: number; title: string; author: string; branch: string; base?: string; additions?: number; deletions?: number; files?: number };

const Spinner: React.FC<{ frame: number; size?: number }> = ({ frame, size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ transform: `rotate(${frame * 12}deg)`, flex: "none" }}>
    <circle cx="12" cy="12" r="9" fill="none" stroke={C.line} strokeWidth={3} />
    <path d="M12 3a9 9 0 0 1 9 9" fill="none" stroke={C.amber} strokeWidth={3} strokeLinecap="round" />
  </svg>
);

// A pull request page. Fill it from `gh pr view <n> --json number,title,author,headRefName,baseRefName,additions,deletions,changedFiles,statusCheckRollup`.
// Each check runs (spinner) until its `t` reaches 1, then shows its result; `approved` (0..1) adds the approval;
// `merged` (0..1) turns the Open pill and the merge box into Merged. Put a DiffBlock or CodeBlock in `children`
// to show the change itself below the header. `frame` drives the spinners.
export const PRView: React.FC<{
  r: Rect; pr: PR; checks?: Check[]; approvedBy?: string; approved?: number; merged?: number; frame: number; children?: React.ReactNode;
}> = ({ r, pr, checks = [], approvedBy, approved = 0, merged = 0, frame, children }) => {
  const isMerged = merged > 0.5;
  const allPass = checks.every((c) => (c.t ?? 1) >= 1 && c.result !== "fail");
  const pill = (bg: string, label: string, icon: "branch" | "merge") => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 999, background: bg, color: "#fff", fontSize: TYPE.small, fontWeight: 650 }}>
      <Icon name={icon} size={22} color="#fff" stroke={2.2} />{label}
    </span>
  );
  return (
    <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, boxSizing: "border-box", background: C.card, borderRadius: RADIUS * 0.6, boxShadow: SHADOW, overflow: "hidden", fontFamily: FONT, color: C.ink, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "28px 36px 22px", borderBottom: `1.5px solid ${C.line}` }}>
        <div style={{ fontSize: TYPE.heading - 6, fontWeight: 650, lineHeight: 1.2 }}>{pr.title} <span style={{ color: C.dim, fontWeight: 400 }}>#{pr.number}</span></div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 14, fontSize: TYPE.small, color: C.dim, flexWrap: "wrap" }}>
          {isMerged ? pill("#8250DF", "Merged", "merge") : pill(C.green, "Open", "branch")}
          <span><b style={{ color: C.ink }}>{pr.author}</b> wants to merge</span>
          <span style={{ fontFamily: MONO, background: "#EEF1FB", color: C.blue, padding: "2px 10px", borderRadius: 6 }}>{pr.branch}</span>
          <span>into</span>
          <span style={{ fontFamily: MONO, background: "#EEF1FB", color: C.blue, padding: "2px 10px", borderRadius: 6 }}>{pr.base ?? "main"}</span>
          {pr.additions !== undefined && <span style={{ marginLeft: "auto", fontFamily: MONO }}><span style={{ color: C.green }}>+{pr.additions}</span> <span style={{ color: C.red }}>−{pr.deletions ?? 0}</span>{pr.files !== undefined && <span> · {pr.files} files</span>}</span>}
        </div>
      </div>
      {children && <div style={{ position: "relative", flex: 1, minHeight: 0 }}>{children}</div>}
      {(checks.length > 0 || approvedBy) && (
        <div style={{ padding: "18px 36px 24px", borderTop: children ? `1.5px solid ${C.line}` : undefined, display: "flex", flexDirection: "column", gap: 12, fontSize: TYPE.small, marginTop: children ? 0 : "auto" }}>
          {checks.map((c) => {
            const done = (c.t ?? 1) >= 1;
            return (
              <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {done ? <Icon name={c.result === "fail" ? "cross" : "check"} size={26} color={c.result === "fail" ? C.red : C.green} stroke={2.6} /> : <Spinner frame={frame} size={26} />}
                <span style={{ fontFamily: MONO }}>{c.name}</span>
                <span style={{ color: C.dim }}>{done ? (c.result === "fail" ? "Failing" : "Successful") : "In progress"}</span>
              </div>
            );
          })}
          {approvedBy && approved > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 14, opacity: approved, transform: `translateY(${(1 - approved) * 10}px)` }}>
              <Icon name="check" size={26} color={C.green} stroke={2.6} /><span><b>{approvedBy}</b> approved these changes</span>
            </div>
          )}
          <div style={{ marginTop: 6, alignSelf: "flex-start", padding: "10px 22px", borderRadius: 10, fontWeight: 650, color: "#fff", background: isMerged ? "#8250DF" : allPass ? C.green : "#B9B6AF", transform: `scale(${1 - 0.06 * Math.sin(Math.PI * Math.min(1, merged * 2))})` }}>
            {isMerged ? "Pull request merged" : "Squash and merge"}
          </div>
        </div>
      )}
    </div>
  );
};

// ---- Terminal sessions ----

// One event in a terminal session. Times are seconds from the start of the recording.
export type TapeEvent = { t: number; cmd?: string; out?: string; err?: boolean };
export type Tape = { title?: string; events: TapeEvent[] };

// Build a scripted session, VHS style: type a command, wait, print output. For real output, record it with
// `npm run capture` instead and import the generated tape.
//   tape([{ cmd: "npm test" }, { wait: 0.6 }, { out: ["PASS src/a.test.ts", "Tests: 12 passed"] }])
export function tape(steps: ({ cmd: string; cps?: number } | { out: string | string[]; err?: boolean; gap?: number } | { wait: number })[], title?: string): Tape {
  const events: TapeEvent[] = [];
  let t = 0;
  for (const s of steps) {
    if ("wait" in s) t += s.wait;
    else if ("cmd" in s) { events.push({ t, cmd: s.cmd }); t += s.cmd.length / (s.cps ?? 28) + 0.35; }
    else for (const line of ([] as string[]).concat(s.out)) { events.push({ t, out: line, err: s.err }); t += s.gap ?? 0.08; }
  }
  return { title, events };
}

const TONE = (line: string, err?: boolean) => err || /\b(error|fail(ed|ing|s)?)\b|[✗✖]/i.test(line) ? "#FF7A7A" : /\b(pass(ed|es)?|ok|success(ful)?|done)\b|[✓✔]/i.test(line) ? "#7BD88F" : "#C9C7C1";

// Replays a Tape in a terminal window at its real pace (times `speed`), typing commands and streaming output,
// and scrolls like a real terminal once it fills. Pauses longer than `maxGap` seconds are shortened so a slow
// build doesn't stall the film. `frame` is the scene frame; `start` is when playback begins.
export const TerminalReplay: React.FC<{ r: Rect; tape: Tape; frame: number; fps: number; start?: number; speed?: number; maxGap?: number; cps?: number; fontSize?: number; title?: string }> = ({
  r, tape: tp, frame, fps, start = 0, speed = 1, maxGap = 1.2, cps = 28, fontSize = TYPE.small, title,
}) => {
  // Squeeze long gaps, then convert to the playback clock.
  let shift = 0, prev = 0;
  const evs = tp.events.map((e) => { const gap = e.t - prev; if (gap > maxGap) shift += gap - maxGap; prev = e.t; return { ...e, at: (e.t - shift) / speed }; });
  const now = (frame - start) / fps;
  const lh = fontSize * 1.55, headH = 52, padY = 22;
  const rows: { text: string; color: string; prompt?: boolean; typing?: boolean }[] = [];
  for (const e of evs) {
    if (e.at > now) break;
    if (e.cmd !== undefined) {
      const n = Math.floor((now - e.at) * cps * speed);
      rows.push({ text: e.cmd.slice(0, n), color: "#F4F2EE", prompt: true, typing: n < e.cmd.length });
    } else rows.push({ text: e.out ?? "", color: TONE(e.out ?? "", e.err) });
  }
  const fit = Math.floor((r.h - headH - padY * 2) / lh);
  const over = Math.max(0, rows.length - fit);
  return (
    <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, background: "#16161A", borderRadius: RADIUS * 0.5, boxShadow: SHADOW, overflow: "hidden", fontFamily: MONO }}>
      <div style={{ height: headH, display: "flex", alignItems: "center", gap: 10, padding: "0 20px", borderBottom: "1px solid #2A2A30" }}>
        {[0, 1, 2].map((i) => <span key={i} style={{ width: 13, height: 13, borderRadius: 99, background: "#3A3A42" }} />)}
        <span style={{ marginLeft: 12, fontSize: 18, color: "#8A8782" }}>{title ?? tp.title ?? "terminal"}</span>
      </div>
      <div style={{ position: "absolute", left: 28, right: 28, top: headH + padY - over * lh, fontSize, lineHeight: `${lh}px`, whiteSpace: "pre", fontFamily: MONO }}>
        {rows.map((row, i) => (
          <div key={i} style={{ color: row.color, height: lh, overflow: "hidden", textOverflow: "ellipsis" }}>
            {row.prompt && <span style={{ color: "#8A8782" }}>$ </span>}
            {row.text}
            {(row.typing || (i === rows.length - 1 && row.prompt && Math.floor(now * 2) % 2 === 0)) && <span style={{ display: "inline-block", width: "0.6em", height: "1.1em", background: "#F4F2EE", verticalAlign: "text-bottom" }} />}
          </div>
        ))}
      </div>
    </div>
  );
};
