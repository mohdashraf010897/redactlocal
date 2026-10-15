import React from "react";
import { C, FONT, MONO, RADIUS, SHADOW, TYPE } from "./theme";
import { Icon, IconName } from "./icons";
import { Rect, lerp } from "./ui";

// System diagrams built from what the repo really contains: services, stores, queues and the calls
// between them. Everything takes 0..1 progress values, so you decide the order and timing in the scene.

export type Node = { id: string; label: string; sub?: string; icon?: IconName; r: Rect; kind?: "service" | "store" | "external" };
export type Edge = { from: string; to: string; label?: string; dashed?: boolean };

// Lays out columns of node ids left to right inside `area` (e.g. client | api | services | data), each
// column centred vertically. Returns a rect per id; pass it as `Node.r`.
export function arrange(columns: string[][], area: Rect, size = { w: 340, h: 140 }, gap = 48): Record<string, Rect> {
  const out: Record<string, Rect> = {};
  const step = columns.length > 1 ? (area.w - size.w) / (columns.length - 1) : 0;
  columns.forEach((col, c) => {
    const total = col.length * size.h + (col.length - 1) * gap;
    col.forEach((id, i) => {
      out[id] = { x: area.x + (columns.length > 1 ? c * step : (area.w - size.w) / 2), y: area.y + (area.h - total) / 2 + i * (size.h + gap), w: size.w, h: size.h };
    });
  });
  return out;
}

const centre = (r: Rect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
// Where the line from the centre of `r` towards (x, y) leaves the rect, pushed out by `pad`.
function exitPoint(r: Rect, x: number, y: number, pad = 10) {
  const c = centre(r), dx = x - c.x, dy = y - c.y;
  const k = Math.min(Math.abs((r.w / 2 + pad) / (dx || 1e-6)), Math.abs((r.h / 2 + pad) / (dy || 1e-6)));
  return { x: c.x + dx * k, y: c.y + dy * k };
}
function ends(a: Rect, b: Rect) {
  const ca = centre(a), cb = centre(b);
  return { p: exitPoint(a, cb.x, cb.y), q: exitPoint(b, ca.x, ca.y) };
}

const Box: React.FC<{ n: Node; enter: number; on: boolean; dim: number }> = ({ n, enter, on, dim }) => {
  const store = n.kind === "store", ext = n.kind === "external";
  return (
    <div style={{
      position: "absolute", left: n.r.x, top: n.r.y, width: n.r.w, height: n.r.h, boxSizing: "border-box", padding: "0 24px",
      display: "flex", alignItems: "center", gap: 18, fontFamily: FONT, color: C.ink,
      background: ext ? "transparent" : C.card, border: ext ? `2px dashed ${C.dim}` : on ? `3px solid ${C.accent}` : `1.5px solid ${C.line}`,
      borderRadius: store ? `${RADIUS}px ${RADIUS}px ${RADIUS * 0.5}px ${RADIUS * 0.5}px / ${RADIUS * 0.7}px ${RADIUS * 0.7}px ${RADIUS * 0.3}px ${RADIUS * 0.3}px` : RADIUS * 0.6,
      boxShadow: ext ? undefined : SHADOW, opacity: enter * dim, transform: `translateY(${(1 - enter) * 18}px) scale(${0.96 + 0.04 * enter})`,
    }}>
      {n.icon && <Icon name={n.icon} size={40} color={on ? C.accent : C.ink} />}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: TYPE.body, fontWeight: 650, lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.label}</div>
        {n.sub && <div style={{ fontSize: TYPE.small, color: C.dim, fontFamily: MONO, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.sub}</div>}
      </div>
    </div>
  );
};

// Boxes and arrows. `enter[id]` (0..1) brings a node in; `draw[i]` (0..1) draws edge i; `focus` (ids) rings
// those nodes in the accent colour and fades the rest by `focusT`. `pulses` send a dot along an edge, for a
// request travelling through the system: `{ edge: i, t }` with t 0..1 (start the next one as this lands).
export const ArchitectureDiagram: React.FC<{
  nodes: Node[]; edges: Edge[]; enter?: Record<string, number>; draw?: number[]; focus?: string[]; focusT?: number;
  pulses?: { edge: number; t: number; color?: string }[];
}> = ({ nodes, edges, enter = {}, draw = [], focus = [], focusT = 1, pulses = [] }) => {
  const at = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const dimOf = (ids: string[]) => (focus.length && !ids.some((id) => focus.includes(id)) ? 1 - 0.6 * focusT : 1);
  return (
    <>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
        {edges.map((e, i) => {
          const a = at[e.from], b = at[e.to];
          if (!a || !b) return null;
          const d = draw[i] ?? 1;
          const { p, q } = ends(a.r, b.r);
          const ang = Math.atan2(q.y - p.y, q.x - p.x), L = 18;
          const tip = `M${q.x - L * Math.cos(ang - 0.45)} ${q.y - L * Math.sin(ang - 0.45)} L${q.x} ${q.y} L${q.x - L * Math.cos(ang + 0.45)} ${q.y - L * Math.sin(ang + 0.45)} Z`;
          const both = focus.includes(e.from) && focus.includes(e.to);
          const col = both && focusT > 0.5 ? C.accent : C.ink;
          return (
            <g key={i} opacity={dimOf([e.from, e.to]) * (d > 0 ? 1 : 0)}>
              <line x1={p.x} y1={p.y} x2={lerp(p.x, q.x, d)} y2={lerp(p.y, q.y, d)} stroke={col} strokeWidth={3} strokeDasharray={e.dashed ? "10 9" : undefined} />
              {d > 0.97 && <path d={tip} fill={col} />}
            </g>
          );
        })}
        {pulses.map((u, i) => {
          const e = edges[u.edge], a = e && at[e.from], b = e && at[e.to];
          if (!a || !b || u.t <= 0 || u.t >= 1) return null;
          const { p, q } = ends(a.r, b.r);
          return <circle key={i} cx={lerp(p.x, q.x, u.t)} cy={lerp(p.y, q.y, u.t)} r={11} fill={u.color ?? C.accent} stroke="#fff" strokeWidth={3} />;
        })}
      </svg>
      {edges.map((e, i) => {
        const a = at[e.from], b = at[e.to];
        if (!e.label || !a || !b) return null;
        const { p, q } = ends(a.r, b.r);
        return (
          <div key={i} style={{ position: "absolute", left: (p.x + q.x) / 2, top: (p.y + q.y) / 2, transform: "translate(-50%,-50%)", padding: "4px 12px", borderRadius: 8, background: C.bg, fontFamily: MONO, fontSize: TYPE.small, color: C.ink, whiteSpace: "nowrap", opacity: Math.max(0, ((draw[i] ?? 1) - 0.6) / 0.4) * dimOf([e.from, e.to]) }}>{e.label}</div>
        );
      })}
      {nodes.map((n) => <Box key={n.id} n={n} enter={enter[n.id] ?? 1} on={focus.includes(n.id) && focusT > 0.5} dim={dimOf([n.id])} />)}
    </>
  );
};

export type Participant = { id: string; label: string; icon?: IconName };
export type Message = { from: string; to: string; label: string; reply?: boolean };

// Sequence diagram. `step` counts messages drawn so far and may be fractional: 2.4 means messages 1 and 2 are
// drawn and the third is 40% of the way across. The newest message is in the accent colour. Keep it to
// about 8 messages; split longer flows over two scenes.
export const SequenceDiagram: React.FC<{ r: Rect; participants: Participant[]; messages: Message[]; step: number; enter?: number }> = ({ r, participants, messages, step, enter = 1 }) => {
  const headH = 96, colW = r.w / participants.length;
  const x = (id: string) => r.x + colW * (participants.findIndex((p) => p.id === id) + 0.5);
  const top = r.y + headH + 40, rowH = Math.min(96, (r.h - headH - 60) / Math.max(1, messages.length));
  const current = Math.min(messages.length - 1, Math.floor(step - 1e-6));
  return (
    <div style={{ position: "absolute", inset: 0, opacity: enter }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {participants.map((p) => <line key={p.id} x1={x(p.id)} y1={r.y + headH} x2={x(p.id)} y2={r.y + r.h} stroke="#C9C4B9" strokeWidth={3} strokeDasharray="8 8" />)}
        {messages.map((m, i) => {
          const d = Math.max(0, Math.min(1, step - i));
          if (d <= 0) return null;
          const y = top + i * rowH, x1 = x(m.from), x2 = x(m.to), col = i === current ? C.accent : C.ink;
          if (m.from === m.to) {
            const w = 70;
            return <path key={i} d={`M${x1} ${y} h${w} v${rowH * 0.45} h${-w + 14}`} fill="none" stroke={col} strokeWidth={3} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - d} />;
          }
          const dir = Math.sign(x2 - x1), xe = lerp(x1, x2 - dir * 4, d);
          return (
            <g key={i}>
              <line x1={x1} y1={y} x2={xe} y2={y} stroke={col} strokeWidth={3} strokeDasharray={m.reply ? "10 8" : undefined} />
              {d > 0.97 && <path d={`M${x2 - dir * 20} ${y - 10} L${x2 - dir * 2} ${y} L${x2 - dir * 20} ${y + 10}`} fill="none" stroke={col} strokeWidth={3} strokeLinejoin="round" />}
            </g>
          );
        })}
      </svg>
      {messages.map((m, i) => {
        const d = Math.max(0, Math.min(1, step - i));
        if (d <= 0) return null;
        const y = top + i * rowH, self = m.from === m.to;
        const cx = self ? x(m.from) + 90 : (x(m.from) + x(m.to)) / 2;
        return (
          <div key={i} style={{ position: "absolute", left: cx, top: y - 40, transform: self ? undefined : "translateX(-50%)", fontFamily: MONO, fontSize: TYPE.small, color: i === current ? C.ink : C.dim, fontWeight: i === current ? 600 : 400, whiteSpace: "nowrap", opacity: Math.min(1, d * 2) }}>{m.label}</div>
        );
      })}
      {participants.map((p) => (
        <div key={p.id} style={{ position: "absolute", left: x(p.id), top: r.y, transform: "translateX(-50%)", height: headH, minWidth: Math.min(colW - 40, 240), padding: "0 26px", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, background: C.card, borderRadius: RADIUS * 0.6, boxShadow: SHADOW, fontFamily: FONT, fontSize: TYPE.body, fontWeight: 650, color: C.ink, whiteSpace: "nowrap" }}>
          {p.icon && <Icon name={p.icon} size={34} />}{p.label}
        </div>
      ))}
    </div>
  );
};
