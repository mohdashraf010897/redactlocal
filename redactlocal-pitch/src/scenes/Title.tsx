import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "../engine";
import { C, FONT, TYPE } from "../kit/theme";
import { ramp, sp } from "../kit/ui";
import { story } from "../story";

// Elegant shield/lock mark for RedactLocal
export const Mark: React.FC<{ size: number; draw?: number; dot?: number }> = ({ size, draw = 1, dot = 1 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200">
    <rect width="200" height="200" rx="46" fill={C.ink} />
    {/* Shield outline */}
    <path
      d="M100 42 C125 42 152 34 152 34 V98 C152 135 125 158 100 168 C75 158 48 135 48 98 V34 C48 34 75 42 100 42 Z"
      fill="none"
      stroke="#ffffff"
      strokeWidth="10"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - draw}
    />
    {/* Center lock / clean dot in accent emerald */}
    <circle cx="100" cy="100" r={18 * dot} fill={C.accent} />
    <path
      d="M92 98 V90 C92 85.5 95.5 82 100 82 C104.5 82 108 85.5 108 90 V98"
      fill="none"
      stroke="#ffffff"
      strokeWidth={5 * dot}
      strokeLinecap="round"
    />
  </svg>
);

export const TITLE_LEN = 140;

export const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const drift = ramp(frame, 0, 60);
  const dot = sp(frame, fps, 10, 10, 140);
  const tag = sp(frame, fps, 24, 20);
  const foot = sp(frame, fps, 40, 20);

  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: C.ink, alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          transform: `translateY(-30px) scale(${0.97 + 0.03 * drift})`,
        }}
      >
        <Mark size={180} dot={dot} />
        <div
          style={{
            display: "flex",
            fontSize: TYPE.hero,
            fontWeight: 800,
            letterSpacing: "-.03em",
            marginTop: 20,
            lineHeight: 1.2,
          }}
        >
          {story.product}
        </div>
        <div
          style={{
            fontSize: TYPE.heading,
            color: C.dim,
            fontWeight: 500,
            letterSpacing: "-.01em",
            marginTop: 12,
            opacity: tag,
            transform: `translateY(${(1 - tag) * 16}px)`,
          }}
        >
          {story.tagline}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 70,
          fontSize: TYPE.small + 2,
          color: C.dim,
          letterSpacing: ".12em",
          fontWeight: 600,
          opacity: foot,
        }}
      >
        {story.footer}
      </div>
    </AbsoluteFill>
  );
};
