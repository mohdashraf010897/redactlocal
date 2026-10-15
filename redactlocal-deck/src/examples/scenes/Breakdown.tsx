import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "../../engine";
import { READ } from "../../kit/film";
import { C, FONT, TYPE } from "../../kit/theme";
import { Caption, Chip, Headline, Rect, glide, lerpRect, ramp, sp } from "../../kit/ui";
import { story } from "../story";
import { Icon, Status } from "../../kit/icons";
import { TARGET, TargetCard } from "./ManyToOne";

// Enters with a handoff: frame 0 redraws the target card exactly where ManyToOne left it, then moves it.
const DOCK: Rect = { x: 160, y: 420, w: 620, h: 260 };
const ROW = (i: number) => 400 + i * 110; // chip rows, centred on the docked card
const CAPTION_AT = 110;
export const BREAKDOWN_LEN = CAPTION_AT + 20 + READ;

export const Breakdown: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const move = glide(frame, 0, 40);
  const title = sp(frame, fps, 14, 20);
  const caption = sp(frame, fps, CAPTION_AT, 20);
  const { lines } = story.breakdown;
  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: C.ink }}>
      <Headline kicker={story.breakdown.kicker} title={story.breakdown.title} enter={title} />
      <TargetCard r={lerpRect(TARGET, DOCK, move)} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {lines.map((_, i) => {
          const y = ROW(i) + 34;
          const d = ramp(frame, 44 + i * 14, 60 + i * 14);
          return <line key={i} x1={DOCK.x + DOCK.w} y1={DOCK.y + DOCK.h / 2} x2={DOCK.x + DOCK.w + (944 - DOCK.x - DOCK.w) * d} y2={DOCK.y + DOCK.h / 2 + (y - DOCK.y - DOCK.h / 2) * d} stroke={C.dim} strokeOpacity={0.5} strokeWidth={2.5} />;
        })}
      </svg>
      {lines.map((l, i) => {
        const s = sp(frame, fps, 54 + i * 14, 16);
        return (
          <div key={i} style={{ position: "absolute", left: 960, top: ROW(i), opacity: s, transform: `translateX(${(1 - s) * 30}px)` }}>
            <Chip icon={"status" in l && l.status ? <Status kind={l.status} size={18} /> : <Icon name={l.icon} size={26} />} glow={1 - ramp(frame, 70 + i * 14, 100 + i * 14)} style={{ fontSize: TYPE.body, padding: "14px 26px" }}>{l.text}</Chip>
          </div>
        );
      })}
      <Caption enter={caption}>{story.breakdown.caption}</Caption>
    </AbsoluteFill>
  );
};
