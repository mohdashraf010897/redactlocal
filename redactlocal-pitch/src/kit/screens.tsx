import React, { useLayoutEffect, useRef, useState } from "react";
import { staticFile } from "../engine";
import { C, FONT, MONO, RADIUS, SHADOW } from "./theme";
import { Icon, IconName } from "./icons";
import { Rect, lerpRect } from "./ui";
import { useHandingOff } from "./film";

// Recreated app screens. ChatWindow defaults to Slack's colours (no logos or product names);
// pass look="neutral" for a generic chat app. Rule: Slack look for internal audiences; neutral for anything
// that may be shown outside the company (customers, conferences, public posts).
// Fill them with real text the user provides (or that you fetched with their tools), anonymised where needed.

const box = (r: Rect): React.CSSProperties => ({ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, boxSizing: "border-box" });
const initials = (name: string) => name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();

// Reactions: `{ icon, count }` draws a kit icon (no emoji); a plain string is shown as-is, e.g. "+1 2".
export type Reaction = string | { icon: IconName; count: number };
// Buttons: Slack-style message buttons (how bots ask for approval). `press` (0..1) pushes a button in.
// `result` replaces the buttons as `resolve` goes 0 -> 1, e.g. "Approved by On-call engineer".
// Every button is a cursor target named `target` (default: its label): <Cursor to="Approve" t={move} />.
export type ChatButton = { label: string; style?: "primary" | "danger"; press?: number; target?: string };
export type ChatMessage = {
  who: string; text: React.ReactNode; time?: string; color?: string; app?: boolean; reactions?: Reaction[];
  buttons?: ChatButton[]; result?: string; resolve?: number;
};

// `enter[i]` (0..1) animates message i in; `focus` dims every other message.
export type ChatLook = "slack" | "neutral";

// Palettes. "slack" mimics Slack's default theme (colours only, no logos); "neutral" is a generic chat app.
const LOOKS = {
  slack: {
    side: "#3F0E40", sideText: "#CFC3CF", sideHead: "#FFFFFF", active: "#1164A3", activeText: "#FFFFFF",
    ink: "#1D1C1D", dim: "#616061", line: "#DDDDDD", badgeBg: "rgba(29,28,29,.13)", badgeText: "#616061",
    reactBg: "rgba(29,28,29,.06)", reactBorder: "transparent", avatarRadius: 8, primary: "#007A5A", danger: "#E01E5A",
  },
  neutral: {
    side: "#2B2A33", sideText: "#C9C7D1", sideHead: "#FFFFFF", active: "rgba(255,255,255,.14)", activeText: "#FFFFFF",
    ink: C.ink, dim: C.dim, line: C.line, badgeBg: "#EEEEEE", badgeText: C.dim,
    reactBg: "transparent", reactBorder: C.line, avatarRadius: 10, primary: C.accent, danger: C.red,
  },
} as const;

type Look = (typeof LOOKS)[ChatLook];

// One message: avatar, name line, text, reactions, buttons. Shared by ChatWindow and LiftedMessage.
const MessageRow: React.FC<{ m: ChatMessage; scale: number; L: Look }> = ({ m, scale, L }) => (
  <>
    <div style={{ width: 48 * scale, height: 48 * scale, borderRadius: L.avatarRadius * scale, background: m.color ?? L.dim, color: "#fff", fontWeight: 700, fontSize: 20 * scale, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{initials(m.who)}</div>
    <div style={{ minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 * scale }}>
        <span style={{ fontWeight: 700, fontSize: 24 * scale }}>{m.who}</span>
        {m.app && <span style={{ fontSize: 14 * scale, fontWeight: 700, color: L.badgeText, background: L.badgeBg, borderRadius: 4, padding: `${1 * scale}px ${5 * scale}px` }}>APP</span>}
        {m.time && <span style={{ fontSize: 20 * scale, color: L.dim }}>{m.time}</span>}
      </div>
      <div style={{ fontSize: 24 * scale, lineHeight: 1.35, marginTop: 2 * scale }}>{m.text}</div>
      {m.reactions && (
        <div style={{ display: "flex", gap: 8 * scale, marginTop: 8 * scale }}>
          {m.reactions.map((x, j) => (
            <span key={j} style={{ display: "inline-flex", alignItems: "center", gap: 6 * scale, fontSize: 20 * scale, color: L.ink, background: L.reactBg, border: `1.5px solid ${L.reactBorder}`, borderRadius: 999, padding: `${2 * scale}px ${10 * scale}px` }}>
              {typeof x === "string" ? x : <><Icon name={x.icon} size={20 * scale} color={L.dim} />{x.count}</>}
            </span>
          ))}
        </div>
      )}
      {m.buttons && <Buttons m={m} scale={scale} L={L} />}
    </div>
  </>
);

// A chat message as its own card. `t` 0 -> 1 goes from flat (as it sits in the window) to a floating card.
// Draw it at the same rect as ChatWindow's `lift.to` in the next scene to carry the message across a handoff.
export const LiftedMessage: React.FC<{ r: Rect; m: ChatMessage; t?: number; scale?: number; look?: ChatLook }> = ({ r, m, t = 1, scale = 1, look = "slack" }) => {
  const L = LOOKS[look];
  const pad = 22 * scale * t;
  return (
    <div style={{ ...box(r), padding: `${pad}px ${pad}px`, display: "flex", gap: 16 * scale, fontFamily: FONT, color: L.ink, background: C.card,
      borderRadius: RADIUS * 0.6 * t, boxShadow: t > 0 ? SHADOW : undefined, overflow: "hidden" }}>
      <MessageRow m={m} scale={scale} L={L} />
    </div>
  );
};

// Chat thread. `lift` pulls message `index` out of the window into its own card at `to` as `t` goes 0 -> 1
// (the window keeps its gap). Hand the card to the next scene (enter: "handoff") by drawing a LiftedMessage at
// the same `to` on its first frame; this window hides its copy during the handoff by itself.
// `follow` pins the thread to the bottom like a live channel: each entering message grows in and pushes the
// older ones up and out of view (a channel filling up). `dim` (0..1) fades and blurs the window, but not a
// lifted card, so the lifted message stands out.
export const ChatWindow: React.FC<{
  r: Rect; channel: string; messages: ChatMessage[]; enter?: number[]; focus?: number; sidebar?: string[]; scale?: number;
  look?: ChatLook; workspace?: string; lift?: { index: number; to: Rect; t: number }; follow?: boolean; dim?: number;
}> = ({ r, channel, messages, enter, focus, sidebar, scale = 1, look = "slack", workspace = "Team chat", lift, follow, dim = 0 }) => {
  const L = LOOKS[look];
  const side = sidebar ? 260 * scale : 0;
  const rows = useRef<(HTMLDivElement | null)[]>([]);
  const [from, setFrom] = useState<Rect | null>(null);
  const [heights, setHeights] = useState<number[]>([]);
  // offset* ignores CSS transforms (the preview scales the stage), so this is in stage pixels.
  useLayoutEffect(() => {
    if (follow) {
      const hs = messages.map((_, i) => rows.current[i]?.offsetHeight ?? 0);
      if (hs.some((h, i) => h !== heights[i])) setHeights(hs);
    }
    const el = lift ? rows.current[lift.index] : null;
    if (!el) return;
    let x = el.offsetLeft, y = el.offsetTop, p = el.offsetParent as HTMLElement | null;
    while (p && p.dataset.chat == null) { x += p.offsetLeft; y += p.offsetTop; p = p.offsetParent as HTMLElement | null; }
    const next = { x: r.x + x, y: r.y + y, w: el.offsetWidth, h: el.offsetHeight };
    if (!from || next.x !== from.x || next.y !== from.y || next.w !== from.w || next.h !== from.h) setFrom(next);
  });
  // During a handoff the next scene draws the lifted card, so this scene hides both copies.
  const handing = useHandingOff();
  const lifting = lift && from && lift.t > 0;
  return (
    <>
      <div data-chat="" style={{ ...box(r), background: C.card, borderRadius: RADIUS * 0.6, boxShadow: SHADOW, overflow: "hidden", display: "flex", fontFamily: FONT, color: L.ink,
        opacity: 1 - 0.45 * dim, filter: dim > 0 ? `blur(${dim * 3}px)` : undefined }}>
        {sidebar && (
          <div style={{ width: side, background: L.side, color: L.sideText, padding: `${24 * scale}px ${14 * scale}px`, fontSize: 24 * scale, display: "flex", flexDirection: "column", gap: 4 * scale, flexShrink: 0 }}>
            <div style={{ color: L.sideHead, fontWeight: 700, fontSize: 26 * scale, margin: `0 ${10 * scale}px ${16 * scale}px` }}>{workspace}</div>
            {sidebar.map((c) => (
              <div key={c} style={{ padding: `${6 * scale}px ${10 * scale}px`, borderRadius: 6 * scale, background: c === channel ? L.active : undefined, color: c === channel ? L.activeText : undefined, fontWeight: c === channel ? 700 : 400 }}># {c}</div>
            ))}
          </div>
        )}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{ padding: `${20 * scale}px ${28 * scale}px`, borderBottom: `1.5px solid ${L.line}`, fontWeight: 700, fontSize: 28 * scale }}># {channel}</div>
          <div style={{ padding: `${16 * scale}px ${28 * scale}px`, display: "flex", flexDirection: "column", gap: follow ? 0 : 18 * scale,
            ...(follow ? { flex: 1, minHeight: 0, justifyContent: "flex-end", overflow: "hidden" } : {}) }}>
            {messages.map((m, i) => {
              const e = enter ? enter[i] ?? 0 : 1;
              const faded = focus !== undefined && focus !== i ? 0.35 : 1;
              const hidden = lifting && lift.index === i;
              const row = (
                <div key={i} ref={(el) => { rows.current[i] = el; }} style={{ display: "flex", gap: 16 * scale, opacity: e * faded, transform: `translateY(${(1 - e) * 16}px)`, visibility: hidden ? "hidden" : undefined }}>
                  <MessageRow m={m} scale={scale} L={L} />
                </div>
              );
              if (!follow) return row;
              const grow = Math.min(1, Math.max(0, e));
              return <div key={i} style={{ flexShrink: 0, height: heights[i] === undefined ? undefined : heights[i] * grow, marginTop: 18 * scale * grow }}>{row}</div>;
            })}
          </div>
        </div>
      </div>
      {lifting && !handing && <LiftedMessage r={lerpRect(from, lift.to, lift.t)} m={messages[lift.index]} t={lift.t} scale={scale} look={look} />}
    </>
  );
};

const Buttons: React.FC<{ m: ChatMessage; scale: number; L: Look }> = ({ m, scale, L }) => {
  const done = m.result ? m.resolve ?? 0 : 0;
  return (
    <div style={{ position: "relative", marginTop: 12 * scale, height: 52 * scale }}>
      <div style={{ display: "flex", gap: 12 * scale, opacity: 1 - done }}>
        {m.buttons!.map((b, j) => {
          const p = b.press ?? 0;
          const fill = b.style === "primary" ? L.primary : "#FFFFFF";
          return (
            <span key={j} data-target={b.target ?? b.label} style={{ display: "inline-flex", alignItems: "center", height: 48 * scale, padding: `0 ${22 * scale}px`, borderRadius: 8 * scale, fontSize: 24 * scale, fontWeight: 700,
              background: fill, color: b.style === "primary" ? "#FFFFFF" : b.style === "danger" ? L.danger : L.ink, border: b.style === "primary" ? "none" : `1.5px solid ${L.line}`,
              transform: `scale(${1 - 0.06 * p})`, filter: `brightness(${1 - 0.15 * p})` }}>{b.label}</span>
          );
        })}
      </div>
      {m.result && (
        <div style={{ position: "absolute", left: 0, top: 0, height: 48 * scale, display: "flex", alignItems: "center", gap: 10 * scale, fontSize: 24 * scale, color: L.ink, opacity: done }}>
          <Icon name="check" size={26 * scale} color={L.primary} stroke={2.6} />{m.result}
        </div>
      )}
    </div>
  );
};

// Generic browser window with an address bar. Put any content inside.
export const BrowserWindow: React.FC<{ r: Rect; url: string; children?: React.ReactNode; scale?: number }> = ({ r, url, children, scale = 1 }) => (
  <div style={{ ...box(r), background: C.card, borderRadius: RADIUS * 0.5, boxShadow: SHADOW, overflow: "hidden", display: "flex", flexDirection: "column", fontFamily: FONT }}>
    <div style={{ height: 64 * scale, background: "#F1EFEA", display: "flex", alignItems: "center", gap: 10 * scale, padding: `0 ${22 * scale}px`, borderBottom: `1.5px solid ${C.line}`, flexShrink: 0 }}>
      {[0, 1, 2].map((i) => <span key={i} style={{ width: 14 * scale, height: 14 * scale, borderRadius: 99, background: "#D6D3CC" }} />)}
      <div style={{ marginLeft: 18 * scale, flex: 1, height: 38 * scale, borderRadius: 10 * scale, background: "#fff", display: "flex", alignItems: "center", padding: `0 ${16 * scale}px`, fontSize: 20 * scale, color: C.dim, whiteSpace: "nowrap", overflow: "hidden" }}>{url}</div>
    </div>
    <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>{children}</div>
  </div>
);

export type TermLine = { text: string; kind?: "cmd" | "out" | "ok" | "err" | "dim" };

// Terminal that types commands. `typed` is the number of characters revealed so far across all lines
// (drive it with interpolate); output lines appear in full once reached.
export const Terminal: React.FC<{ r: Rect; lines: TermLine[]; typed?: number; title?: string; fontSize?: number }> = ({ r, lines, typed = Infinity, title = "terminal", fontSize = 24 }) => {
  let left = typed;
  const color = { cmd: "#F4F2EE", out: "#C9C7C1", ok: "#7BD88F", err: "#FF7A7A", dim: "#8A8782" };
  return (
    <div style={{ ...box(r), background: "#16161A", borderRadius: RADIUS * 0.5, boxShadow: SHADOW, overflow: "hidden", fontFamily: MONO }}>
      <div style={{ height: 52, display: "flex", alignItems: "center", gap: 10, padding: "0 20px", borderBottom: "1px solid #2A2A30" }}>
        {[0, 1, 2].map((i) => <span key={i} style={{ width: 13, height: 13, borderRadius: 99, background: "#3A3A42" }} />)}
        <span style={{ marginLeft: 12, fontSize: 18, color: "#8A8782" }}>{title}</span>
      </div>
      <div style={{ padding: "22px 28px", fontSize, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
        {lines.map((l, i) => {
          if (left <= 0) return null;
          const kind = l.kind ?? "out";
          const full = kind === "cmd" ? l.text.length : 1; // output appears at once
          const shown = kind === "cmd" ? l.text.slice(0, Math.floor(left)) : l.text;
          const typing = kind === "cmd" && left < full;
          left -= full;
          return (
            <div key={i} style={{ color: color[kind] }}>
              {kind === "cmd" && <span style={{ color: color.dim }}>$ </span>}
              {shown}
              {typing && <span style={{ display: "inline-block", width: "0.6em", height: "1.1em", background: "#F4F2EE", verticalAlign: "text-bottom" }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// A real screenshot from public/. `focus` (in image pixels) zooms into a region as `zoom` goes 0 -> 1.
// `redact` boxes are solid fills (not blur), so the hidden text cannot be recovered.
export const Screenshot: React.FC<{
  r: Rect; src: string; imgW: number; imgH: number; focus?: Rect; zoom?: number; highlight?: Rect; highlightOn?: number; redact?: Rect[]; frame?: boolean;
}> = ({ r, src, imgW, imgH, focus, zoom = 0, highlight, highlightOn = 1, redact = [], frame = true }) => {
  const whole: Rect = { x: 0, y: 0, w: imgW, h: imgH };
  const view = focus ? lerpRect(whole, focus, zoom) : whole;
  const s = Math.min(r.w / view.w, r.h / view.h);
  const tx = r.w / 2 - (view.x + view.w / 2) * s;
  const ty = r.h / 2 - (view.y + view.h / 2) * s;
  const ring = 4 / s;
  return (
    <div style={{ ...box(r), overflow: "hidden", borderRadius: frame ? RADIUS * 0.5 : 0, boxShadow: frame ? SHADOW : undefined, background: C.card }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: imgW, height: imgH, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${s})` }}>
        <img src={src.startsWith("public/") || src.startsWith("data:") ? src : staticFile(src)} width={imgW} height={imgH} style={{ display: "block" }} />
        {redact.map((q, i) => <div key={i} style={{ position: "absolute", left: q.x, top: q.y, width: q.w, height: q.h, background: "#D9D6CF", borderRadius: 4 / s }} />)}
        {highlight && (
          <div style={{ position: "absolute", left: highlight.x - ring * 2, top: highlight.y - ring * 2, width: highlight.w + ring * 4, height: highlight.h + ring * 4, border: `${ring}px solid ${C.accent}`, borderRadius: 10 / s, opacity: highlightOn, boxSizing: "border-box" }} />
        )}
      </div>
    </div>
  );
};

// Where a point in the image (e.g. the centre of a box from \`npm run shoot\`) lands in the frame, for the
// same r / focus / zoom you pass to Screenshot. Use it to put a Cursor or an Arrow on a real button.
export const shotPoint = (r: Rect, imgW: number, imgH: number, p: { x: number; y: number; w?: number; h?: number }, focus?: Rect, zoom = 0) => {
  const view = focus ? lerpRect({ x: 0, y: 0, w: imgW, h: imgH }, focus, zoom) : { x: 0, y: 0, w: imgW, h: imgH };
  const s = Math.min(r.w / view.w, r.h / view.h);
  const px = p.x + (p.w ?? 0) / 2, py = p.y + (p.h ?? 0) / 2;
  return { x: r.x + r.w / 2 + (px - view.x - view.w / 2) * s, y: r.y + r.h / 2 + (py - view.y - view.h / 2) * s };
};

// Number of characters to reveal for a typing effect at `cps` characters per second.
export const typedChars = (frame: number, fps: number, start: number, cps = 28) => Math.max(0, (frame - start) * (cps / fps));
