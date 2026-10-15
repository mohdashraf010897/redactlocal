import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "../engine";
import { C, FONT, MONO, TYPE } from "../kit/theme";
import { ramp, sp } from "../kit/ui";
import { story } from "../story";

export const RedactMark: React.FC<{ size: number; dot?: number }> = ({ size, dot = 1 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200">
    <rect width="200" height="200" rx="44" fill="#1E293B" stroke={C.line} strokeWidth="4" />
    <path d="M100 35 L155 58 V105 C155 140 128 165 100 175 C72 165 45 140 45 105 V58 Z" fill="none" stroke={C.accent} strokeWidth="10" strokeLinejoin="round" />
    <rect x="42" y="88" width={116 * dot} height="28" rx="6" fill="#020617" stroke="#38BDF8" strokeWidth="2" />
    <circle cx="152" cy="50" r={14 * dot} fill={C.green} />
  </svg>
);

export const TITLE_LEN = 150; // 5.0 seconds

export const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const drift = ramp(frame, 0, 60);
  const dot = sp(frame, fps, 10, 10, 140);
  const tag = sp(frame, fps, 24, 20);
  const foot = sp(frame, fps, 40, 20);

  return (
    <AbsoluteFill style={{ fontFamily: FONT, background: C.bg, color: C.ink, alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: `translateY(-20px) scale(${0.97 + 0.03 * drift})` }}>
        <RedactMark size={160} dot={dot} />
        <div style={{ display: "flex", fontSize: TYPE.hero - 16, fontWeight: 800, letterSpacing: "-.03em", marginTop: 24, lineHeight: 1.1 }}>
          {story.product}
        </div>
        <div style={{ fontSize: TYPE.heading - 4, color: C.dim, fontWeight: 500, letterSpacing: "-.01em", marginTop: 14, opacity: tag, transform: `translateY(${(1 - tag) * 16}px)` }}>
          {story.tagline}
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 70, fontSize: TYPE.small, color: "#38BDF8", fontFamily: MONO, letterSpacing: ".12em", fontWeight: 700, opacity: foot }}>
        🛡️ {story.badge}
      </div>
    </AbsoluteFill>
  );
};
