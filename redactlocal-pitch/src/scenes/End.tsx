import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "../engine";
import { C, FONT, MONO, SHADOW, TYPE } from "../kit/theme";
import { sp } from "../kit/ui";
import { story } from "../story";
import { Mark } from "./Title";

export const END_LEN = 150;

export const End: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = sp(frame, fps, 0, 16);
  const line = sp(frame, fps, 18, 20);
  const chip = sp(frame, fps, 34, 18);

  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: C.ink, alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 36, opacity: logo, transform: `scale(${0.92 + 0.08 * logo})` }}>
        <Mark size={160} />
        <div style={{ fontSize: 130, fontWeight: 800, letterSpacing: "-.03em" }}>{story.product}</div>
      </div>
      <div
        style={{
          fontSize: TYPE.heading,
          fontWeight: 600,
          letterSpacing: "-.01em",
          marginTop: 36,
          opacity: line,
          transform: `translateY(${(1 - line) * 14}px)`,
          color: C.dim,
        }}
      >
        {story.end.line}
      </div>
      <div
        style={{
          marginTop: 40,
          fontFamily: MONO,
          fontSize: 26,
          fontWeight: 700,
          background: "#FFFFFF",
          color: C.accent,
          borderRadius: 999,
          padding: "16px 36px",
          boxShadow: SHADOW,
          border: "2px solid #A7F3D0",
          opacity: chip,
        }}
      >
        {story.end.cta}
      </div>
    </AbsoluteFill>
  );
};
