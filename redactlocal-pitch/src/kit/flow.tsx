import React from "react";
import { C, FONT, MONO, RADIUS, SHADOW, TYPE } from "./theme";
import { Icon, IconName, Status } from "./icons";
import { Arrow, Rect } from "./ui";

// Building blocks for "many become one" and for the result cards that close a story.

// `n` equal rects stacked in `area`, `gap` apart. Use it to lay out the sources of a FanIn.
export const column = (n: number, area: Rect, gap = 24): Rect[] => {
  const h = (area.h - gap * (n - 1)) / n;
  return Array.from({ length: n }, (_, i) => ({ x: area.x, y: area.y + i * (h + gap), w: area.w, h }));
};

// Arrows from the right edge of every `from` rect into the left edge of `to`, landing evenly spread down
// its side. `draw[i]` (0..1) draws arrow i; stagger them and let `to` land as the last one finishes.
// The source cards and the result card are drawn by you; this only draws the arrows. Keep the sources
// on screen: they are the evidence for the result.
export const FanIn: React.FC<{ from: Rect[]; to: Rect; draw: number[]; color?: string; gap?: number }> = ({ from, to, draw, color = C.ink, gap = 18 }) => {
  const n = from.length;
  const span = Math.min(to.h * 0.5, 36 * (n - 1));
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
      {from.map((r, i) => {
        const y2 = to.y + to.h / 2 + (n > 1 ? (i / (n - 1) - 0.5) * span : 0);
        return <Arrow key={i} x1={r.x + r.w + gap} y1={r.y + r.h / 2} x2={to.x - gap} y2={y2} draw={draw[i] ?? 0} color={color} />;
      })}
    </svg>
  );
};

export type Tone = "good" | "warn" | "bad" | "neutral";
const TONE = { good: C.green, warn: C.amber, bad: C.red, neutral: C.dim } as const;

// Small status pill: "#4354 passed", "3 signals", "Investigating…". `enter` (0..1) pops it in.
export const StatusChip: React.FC<{ children: React.ReactNode; tone?: Tone; icon?: IconName; enter?: number; style?: React.CSSProperties }> = ({ children, tone = "neutral", icon, enter = 1, style }) => (
  <div style={{
    display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 18px", borderRadius: 999, fontFamily: FONT, fontSize: TYPE.small, fontWeight: 600,
    background: C.card, color: C.ink, boxShadow: SHADOW, whiteSpace: "nowrap", opacity: enter, transform: `scale(${0.9 + 0.1 * enter})`, ...style,
  }}>
    {icon ? <Icon name={icon} size={24} color={TONE[tone]} stroke={2.4} /> : <Status kind={tone} />}
    {children}
  </div>
);

// Generic issue-tracker card (no product logos): key, title, status, a few fields, optional footer line.
// Use for "a ticket was filed" moments. `status` is drawn as a pill in the top-right corner.
export type TicketField = { label: string; value: React.ReactNode };
export const TicketCard: React.FC<{
  r: Rect; id: string; title: React.ReactNode; status?: string; tone?: Tone; fields?: TicketField[]; footer?: React.ReactNode; kind?: string; style?: React.CSSProperties;
}> = ({ r, id, title, status, tone = "neutral", fields = [], footer, kind = "Bug", style }) => (
  <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, boxSizing: "border-box", padding: "28px 32px", background: C.card, borderRadius: RADIUS, boxShadow: SHADOW, fontFamily: FONT, color: C.ink, overflow: "hidden", display: "flex", flexDirection: "column", gap: 14, ...style }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: TYPE.small, color: C.dim }}>
      <span style={{ width: 22, height: 22, borderRadius: 5, background: C.red, display: "inline-block" }} />
      <span>{kind}</span>
      <span style={{ fontFamily: MONO, color: C.ink, fontWeight: 600 }}>{id}</span>
      {status && <span style={{ marginLeft: "auto", padding: "4px 14px", borderRadius: 6, fontSize: TYPE.small - 2, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: TONE[tone], background: `${TONE[tone]}1F` }}>{status}</span>}
    </div>
    <div style={{ fontSize: TYPE.body + 2, fontWeight: 650, lineHeight: 1.25 }}>{title}</div>
    {fields.length > 0 && (
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 24, rowGap: 8, fontSize: TYPE.small }}>
        {fields.map((f) => <React.Fragment key={f.label}><span style={{ color: C.dim }}>{f.label}</span><span>{f.value}</span></React.Fragment>)}
      </div>
    )}
    {footer && <div style={{ marginTop: "auto", fontSize: TYPE.small, color: C.dim, display: "flex", alignItems: "center", gap: 8 }}><Icon name="link" size={22} color={C.dim} />{footer}</div>}
  </div>
);
