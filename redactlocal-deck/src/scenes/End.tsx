import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "../engine";
import { C, FONT, MONO, TYPE, SHADOW } from "../kit/theme";
import { sp } from "../kit/ui";
import { story } from "../story";
import { RedactMark } from "./Title";

export const END_LEN = 240; // 8.0 seconds

export const End: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoIn = sp(frame, fps, 6, 20);
  const headIn = sp(frame, fps, 24, 20);
  const priceIn = sp(frame, fps, 60, 22);
  const ctaIn = sp(frame, fps, 100, 22);
  const footIn = sp(frame, fps, 140, 20);

  return (
    <AbsoluteFill style={{ fontFamily: FONT, background: C.bg, color: C.ink, alignItems: "center", justifyContent: "center", padding: "60px 100px", boxSizing: "border-box" }}>
      
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", maxWidth: 980 }}>
        
        {/* Logo & Mark */}
        <div style={{ opacity: logoIn, transform: `scale(${0.9 + 0.1 * logoIn})`, marginBottom: 16 }}>
          <RedactMark size={110} />
        </div>

        {/* Main Headline */}
        <div style={{
          fontSize: TYPE.title - 10,
          fontWeight: 800,
          letterSpacing: "-.02em",
          color: C.ink,
          lineHeight: 1.15,
          opacity: headIn,
          transform: `translateY(${(1 - headIn) * 16}px)`,
        }}>
          {story.end.headline}
        </div>

        {/* Price Contrast Badge */}
        <div style={{
          opacity: priceIn,
          transform: `translateY(${(1 - priceIn) * 16}px)`,
          marginTop: 20,
          background: "#020617",
          border: `1px solid ${C.line}`,
          borderRadius: 12,
          padding: "12px 28px",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}>
          <span style={{ fontSize: TYPE.body - 6, fontWeight: 700, color: C.green, fontFamily: MONO }}>
            {story.end.priceTag}
          </span>
          <span style={{ height: 16, width: 1, background: C.line }} />
          <span style={{ fontSize: TYPE.small - 4, color: C.dim }}>
            {story.end.vsAcrobat}
          </span>
        </div>

        {/* CTAs */}
        <div style={{
          opacity: ctaIn,
          transform: `translateY(${(1 - ctaIn) * 16}px)`,
          marginTop: 32,
          display: "flex",
          gap: 18,
          flexWrap: "wrap",
          justifyContent: "center",
        }}>
          <div style={{
            background: C.accent,
            color: "#ffffff",
            padding: "14px 28px",
            borderRadius: 10,
            fontSize: TYPE.small - 2,
            fontWeight: 700,
            boxShadow: SHADOW,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}>
            {story.end.ctaMac}
          </div>
          <div style={{
            background: C.card,
            border: `1px solid ${C.line}`,
            color: C.ink,
            padding: "14px 28px",
            borderRadius: 10,
            fontSize: TYPE.small - 2,
            fontWeight: 700,
            boxShadow: SHADOW,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}>
            {story.end.ctaWeb}
          </div>
        </div>

        {/* Footer URL */}
        <div style={{
          opacity: footIn,
          transform: `translateY(${(1 - footIn) * 12}px)`,
          marginTop: 36,
          fontFamily: MONO,
          fontSize: TYPE.small - 2,
          color: "#38BDF8",
          letterSpacing: ".05em",
          fontWeight: 600,
        }}>
          👉 {story.end.url}
        </div>

      </div>

    </AbsoluteFill>
  );
};
