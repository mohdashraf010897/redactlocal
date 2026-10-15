import React, { useLayoutEffect, useRef, useState } from "react";
import { Easing, interpolate, spring, useCaptions } from "../engine";
import { C, FONT, MONO, RADIUS, SHADOW, TYPE } from "./theme";

const clampOpt = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Spring from 0 to 1 starting at `delay`. Higher damping = less bounce; `dur` forces a length in frames.
export const sp = (frame: number, fps: number, delay = 0, damping = 16, stiffness = 100, dur?: number) =>
  spring({ frame: frame - delay, fps, config: { damping, stiffness }, durationInFrames: dur });

// Linear 0 -> 1 between frames a and b, clamped.
export const ramp = (frame: number, a: number, b: number) => interpolate(frame, [a, b], [0, 1], clampOpt);
// Smooth in-out 0 -> 1 between frames a and b. Use for shared-element morphs and camera-like moves.
const smooth = Easing.bezier(0.45, 0, 0.2, 1);
export const glide = (frame: number, a: number, b: number) => interpolate(frame, [a, b], [0, 1], { ...clampOpt, easing: smooth });
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerpRect = (a: Rect, b: Rect, t: number): Rect => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) });
export type Rect = { x: number; y: number; w: number; h: number };

// Kicker + big title, centred near the top. `enter`/`exit` are 0..1 progress values.
export const Headline: React.FC<{ kicker?: string; title: React.ReactNode; enter: number; exit?: number; top?: number }> = ({ kicker, title, enter, exit = 0, top = 80 }) => (
  <div style={{ position: "absolute", top, width: "100%", textAlign: "center", fontFamily: FONT, color: C.ink, opacity: enter * (1 - exit), transform: `translateY(${(1 - enter) * 20 - exit * 20}px)`, filter: exit > 0 ? `blur(${exit * 6}px)` : undefined }}>
    {kicker && <div style={{ fontSize: TYPE.kicker, color: C.dim, fontWeight: 500 }}>{kicker}</div>}
    <div style={{ fontSize: TYPE.title, fontWeight: 700, letterSpacing: "-.02em", marginTop: 6 }}>{title}</div>
  </div>
);

// Bottom caption: the one sentence a viewer should remember from the scene.
// `strong` makes it full-contrast ink for the scene's key sentence; default is quiet secondary text.
// When the film is rendered with burned-in captions, it moves up above them.
export const Caption: React.FC<{ enter: number; children: React.ReactNode; bottom?: number; strong?: boolean }> = ({ enter, children, bottom = 52, strong }) => (
  <div style={{ position: "absolute", bottom: bottom + (useCaptions()?.length ? 110 : 0), width: "100%", textAlign: "center", fontFamily: FONT, fontSize: TYPE.body, color: strong ? C.ink : C.dim, fontWeight: strong ? 600 : 400, opacity: enter, transform: `translateY(${(1 - enter) * 12}px)` }}>{children}</div>
);

export const Card: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode }> = ({ style, children }) => (
  <div style={{ position: "absolute", background: C.card, borderRadius: RADIUS, boxShadow: SHADOW, boxSizing: "border-box", fontFamily: FONT, color: C.ink, ...style }}>{children}</div>
);

// Monospace pill for tools, files, commands. `glow` (0..1) highlights it in the accent colour.
export const Chip: React.FC<{ children: React.ReactNode; icon?: React.ReactNode; glow?: number; muted?: boolean; style?: React.CSSProperties }> = ({ children, icon, glow = 0, muted, style }) => (
  <div style={{
    display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 16px", borderRadius: 12, fontFamily: MONO, fontSize: TYPE.small, whiteSpace: "nowrap", boxSizing: "border-box",
    background: glow > 0 ? `rgba(255,90,31,${0.12 * glow})` : "#F3F1EC", border: `1.5px solid ${glow > 0 ? `rgba(255,90,31,${glow})` : C.line}`, color: muted ? C.dim : C.ink, ...style,
  }}>{icon}{children}</div>
);

// Words rise in one after another, starting at `delay`, `gap` frames apart.
export const Words: React.FC<{ text: string; frame: number; fps: number; delay?: number; gap?: number; style?: React.CSSProperties }> = ({ text, frame, fps, delay = 0, gap = 3, style }) => (
  <span style={style}>
    {text.split(" ").map((w, i) => {
      const s = sp(frame, fps, delay + i * gap, 18);
      return <span key={i} style={{ display: "inline-block", opacity: Math.min(1, s * 1.4), transform: `translateY(${(1 - s) * 30}px)`, marginRight: "0.25em" }}>{w}</span>;
    })}
  </span>
);

// Curved arrow from (x1,y1) to (x2,y2); `draw` animates the stroke from 0 to 1. Place inside a full-frame <svg>.
export const Arrow: React.FC<{ x1: number; y1: number; x2: number; y2: number; draw?: number; color?: string; width?: number }> = ({ x1, y1, x2, y2, draw = 1, color = C.ink, width = 3 }) => {
  const mx = (x1 + x2) / 2;
  const d = `M${x1} ${y1} C${mx} ${y1}, ${mx} ${y2}, ${x2 - 14} ${y2}`;
  return (
    <g>
      <path d={d} fill="none" stroke={color} strokeWidth={width} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
      {draw > 0.95 && <path d={`M${x2 - 18} ${y2 - 10} L${x2} ${y2} L${x2 - 18} ${y2 + 10} Z`} fill={color} />}
    </g>
  );
};

// Mouse pointer; `press` (0..1) shrinks it for a click. Starts at (x, y). With `to`, it glides as `t` goes
// 0 -> 1 onto the centre of the element marked data-target={to} in the same scene (ChatWindow buttons are
// marked with their label), measured every frame, so you never aim by eye.
export const Cursor: React.FC<{ x: number; y: number; press?: number; opacity?: number; to?: string; t?: number }> = ({ x, y, press = 0, opacity = 1, to, t = 1 }) => {
  const ref = useRef<SVGSVGElement>(null);
  const [aim, setAim] = useState<{ x: number; y: number } | null>(null);
  useLayoutEffect(() => {
    const host = ref.current?.parentElement;
    if (!to || !host) return;
    const el = host.querySelector(`[data-target="${CSS.escape(to)}"]`) ?? document.querySelector(`[data-target="${CSS.escape(to)}"]`);
    if (!el) return;
    const h = host.getBoundingClientRect(), b = el.getBoundingClientRect(), k = h.width / host.offsetWidth || 1;
    const next = { x: (b.left + b.width / 2 - h.left) / k - 5, y: (b.top + b.height / 2 - h.top) / k - 3 }; // tip of the arrow on the centre
    if (!aim || Math.abs(next.x - aim.x) > 0.5 || Math.abs(next.y - aim.y) > 0.5) setAim(next);
  });
  const px = aim ? lerp(x, aim.x, t) : x, py = aim ? lerp(y, aim.y, t) : y;
  return (
    <svg ref={ref} width={36} height={36} viewBox="0 0 22 22" style={{ position: "absolute", left: px, top: py, transform: `scale(${1 - 0.15 * press})`, transformOrigin: "top left", opacity, filter: "drop-shadow(0 2px 3px rgba(0,0,0,.3))" }}>
      <path d="M3 2 L3 19 L7.5 14.8 L10.5 21.5 L13.3 20.3 L10.4 13.7 L16.5 13.7 Z" fill={C.ink} stroke="#fff" strokeWidth={1.4} strokeLinejoin="round" />
    </svg>
  );
};

// Number that counts up to `to` as `t` goes 0 -> 1.
export const CountUp: React.FC<{ to: number; t: number; decimals?: number; prefix?: string; suffix?: string; style?: React.CSSProperties }> = ({ to, t, decimals = 0, prefix = "", suffix = "", style }) => (
  <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>{prefix}{(to * t).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>
);

// Horizontal bar chart. Bars grow in sequence as `t` goes 0 -> 1.
export const Bars: React.FC<{ data: { label: string; value: number; highlight?: boolean }[]; t: number; width: number; unit?: string }> = ({ data, t, width, unit = "" }) => {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 34, fontFamily: FONT, width }}>
      {data.map((d, i) => {
        const k = Math.min(1, Math.max(0, t * data.length - i * 0.6));
        return (
          <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 220, fontSize: TYPE.body, color: C.dim, textAlign: "right" }}>{d.label}</div>
            <div style={{ height: 64, width: (width - 380) * (d.value / max) * k, background: d.highlight ? C.accent : C.ink, borderRadius: 10 }} />
            <div style={{ fontSize: TYPE.body + 4, fontWeight: 600, opacity: k }}><CountUp to={d.value} t={k} suffix={unit} /></div>
          </div>
        );
      })}
    </div>
  );
};
