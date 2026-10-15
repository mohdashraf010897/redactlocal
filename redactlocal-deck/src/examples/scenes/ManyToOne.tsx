import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "../../engine";
import { READ, useHandingOff } from "../../kit/film";
import { C, FONT, MONO, TYPE } from "../../kit/theme";
import { Arrow, Card, Headline, Rect, ramp, sp } from "../../kit/ui";
import { story } from "../story";

// Final rect of the target card. The next scene starts from exactly here (shared-element handoff).
export const TARGET: Rect = { x: 1230, y: 420, w: 560, h: 260 };
const CARD = { x: 140, w: 760, h: 150, gap: 30, top: 330 };
const ISSUE_AT = 70; // target card lands
export const MANY_LEN = ISSUE_AT + 30 + READ;

export const TargetCard: React.FC<{ r: Rect; inner?: number }> = ({ r, inner = 1 }) => {
  const t = story.many.target;
  return (
    <Card style={{ left: r.x, top: r.y, width: r.w, height: r.h, padding: 40, overflow: "hidden" }}>
      <div style={{ opacity: inner }}>
        <div style={{ fontFamily: MONO, fontSize: TYPE.small, color: C.accent, letterSpacing: ".08em" }}>{t.label}</div>
        <div style={{ fontSize: TYPE.heading, fontWeight: 700, letterSpacing: "-.01em", marginTop: 14 }}>{t.title}</div>
        <div style={{ fontSize: TYPE.small + 2, color: C.dim, marginTop: 14 }}>{t.sub}</div>
      </div>
    </Card>
  );
};

export const ManyToOne: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const title = sp(frame, fps, 0, 20);
  const target = sp(frame, fps, ISSUE_AT, 16);
  const handing = useHandingOff(); // Breakdown redraws the target card from here on
  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: C.ink }}>
      <Headline kicker={story.many.kicker} title={story.many.title} enter={title} />
      {story.many.cards.map((c, i) => {
        const s = sp(frame, fps, 8 + i * 8, 16);
        const y = CARD.top + i * (CARD.h + CARD.gap);
        return (
          <Card key={i} style={{ left: CARD.x, top: y, width: CARD.w, height: CARD.h, padding: "30px 36px", opacity: s, transform: `translateX(${(1 - s) * -40}px)` }}>
            <div style={{ fontSize: TYPE.small, color: C.dim, fontWeight: 600 }}>{c.who}</div>
            <div style={{ fontSize: TYPE.body + 2, marginTop: 10 }}>{c.text}</div>
          </Card>
        );
      })}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {story.many.cards.map((_, i) => {
          const y = CARD.top + i * (CARD.h + CARD.gap) + CARD.h / 2;
          return <Arrow key={i} x1={CARD.x + CARD.w + 20} y1={y} x2={TARGET.x - 16} y2={TARGET.y + TARGET.h / 2 + (i - 1) * 50} draw={ramp(frame, 40 + i * 8, 70 + i * 8)} />;
        })}
      </svg>
      <div style={{ opacity: handing ? 0 : target, transform: `scale(${0.9 + 0.1 * target})`, transformOrigin: `${TARGET.x + TARGET.w / 2}px ${TARGET.y + TARGET.h / 2}px`, position: "absolute", inset: 0 }}>
        <TargetCard r={TARGET} />
      </div>
    </AbsoluteFill>
  );
};
