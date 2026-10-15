import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "../../engine";
import { C, FONT, MONO, SHADOW, TYPE } from "../../kit/theme";
import { sp } from "../../kit/ui";
import { story } from "../story";
import { Mark } from "./Title";

export const END_LEN = 165;

export const End: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = sp(frame, fps, 0, 16);
  const line = sp(frame, fps, 18, 20);
  const chip = sp(frame, fps, 34, 18);
  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: C.ink, alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 36, opacity: logo, transform: `scale(${0.92 + 0.08 * logo})` }}>
        <Mark size={150} />
        <div style={{ fontSize: 140, fontWeight: 700, letterSpacing: "-.025em" }}>{story.product}</div>
      </div>
      <div style={{ fontSize: TYPE.heading + 2, fontWeight: 500, letterSpacing: "-.01em", marginTop: 40, opacity: line, transform: `translateY(${(1 - line) * 14}px)` }}>{story.end.line}</div>
      <div style={{ marginTop: 44, fontFamily: MONO, fontSize: 28, background: "#fff", borderRadius: 999, padding: "12px 28px", boxShadow: SHADOW, opacity: chip }}>{story.end.cta}</div>
    </AbsoluteFill>
  );
};
