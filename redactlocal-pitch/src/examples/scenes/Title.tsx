import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "../../engine";
import { C, FONT, TYPE } from "../../kit/theme";
import { ramp, sp } from "../../kit/ui";
import { story } from "../story";

// Simple geometric mark: a ring, then a dot pops in. Replace with the product's own mark.
export const Mark: React.FC<{ size: number; draw?: number; dot?: number }> = ({ size, draw = 1, dot = 1 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200">
    <rect width="200" height="200" rx="46" fill={C.ink} />
    <circle cx="100" cy="100" r="52" fill="none" stroke="#fff" strokeWidth="12" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} transform="rotate(-90 100 100)" />
    <circle cx="148" cy="62" r={16 * dot} fill={C.accent} />
  </svg>
);

export const TITLE_LEN = 150; // tagline lands ~45, then ~3.5 s hold (short text)

export const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Frame 0 is the cover GitHub and Slack show, so the mark and name are already in place; only details animate.
  const drift = ramp(frame, 0, 60);
  const dot = sp(frame, fps, 10, 10, 140);
  const tag = sp(frame, fps, 24, 20);
  const foot = sp(frame, fps, 40, 20);
  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: C.ink, alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: `translateY(-30px) scale(${0.97 + 0.03 * drift})` }}>
        <Mark size={180} dot={dot} />
        <div style={{ display: "flex", fontSize: TYPE.hero, fontWeight: 700, letterSpacing: "-.025em", marginTop: 16, lineHeight: 1.3 }}>
          {story.product}
        </div>
        <div style={{ fontSize: TYPE.heading, color: C.dim, fontWeight: 500, letterSpacing: "-.005em", marginTop: 10, opacity: tag, transform: `translateY(${(1 - tag) * 16}px)` }}>{story.tagline}</div>
      </div>
      <div style={{ position: "absolute", bottom: 70, fontSize: TYPE.small + 2, color: C.dim, letterSpacing: ".12em", fontWeight: 500, opacity: foot }}>{story.footer}</div>
    </AbsoluteFill>
  );
};
