import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "../engine";
import { C, FONT, MONO, TYPE, SHADOW } from "../kit/theme";
import { sp } from "../kit/ui";
import { story } from "../story";

export const TRAP_LEN = 240; // 8.0 seconds

export const Trap: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = sp(frame, fps, 6, 18);
  const cardIn = sp(frame, fps, 20, 22);
  const blackBoxIn = sp(frame, fps, 55, 18);
  const xrayIn = sp(frame, fps, 95, 24);
  const alertIn = sp(frame, fps, 135, 20);

  return (
    <AbsoluteFill style={{ fontFamily: FONT, background: C.bg, color: C.ink, padding: "80px 100px", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      
      {/* Top Header */}
      <div style={{ opacity: titleIn, transform: `translateY(${(1 - titleIn) * 20}px)` }}>
        <div style={{ fontFamily: MONO, fontSize: TYPE.kicker - 8, color: C.red, fontWeight: 700, letterSpacing: ".12em", marginBottom: 8 }}>
          {story.trap.kicker}
        </div>
        <div style={{ fontSize: TYPE.title - 12, fontWeight: 800, letterSpacing: "-.02em", color: C.ink }}>
          {story.trap.title}
        </div>
        <div style={{ fontSize: TYPE.heading - 14, color: C.dim, marginTop: 8 }}>
          {story.trap.subtitle}
        </div>
      </div>

      {/* Main Document Inspection Card */}
      <div style={{
        background: C.card,
        border: `1px solid ${C.line}`,
        borderRadius: 20,
        padding: "36px 48px",
        boxShadow: SHADOW,
        opacity: cardIn,
        transform: `translateY(${(1 - cardIn) * 30}px)`,
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}>
        {/* Document Tab */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.line}`, paddingBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>📄</span>
            <span style={{ fontFamily: MONO, fontSize: TYPE.small, fontWeight: 600, color: C.ink }}>{story.trap.docName}</span>
          </div>
          <span style={{ fontFamily: MONO, fontSize: 16, color: C.dim, background: "#0F172A", padding: "4px 10px", borderRadius: 6 }}>ISO 32000-1 RAW STREAM</span>
        </div>

        {/* Fake Redacted Area */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: TYPE.body - 4, color: C.dim }}>
            Legal Taxpayer ID / Social Security Number:
          </div>

          <div style={{ position: "relative", height: 60, display: "flex", alignItems: "center", background: "#020617", borderRadius: 8, padding: "0 20px", border: `1px solid ${C.line}` }}>
            {/* The Text behind */}
            <span style={{ fontFamily: MONO, fontSize: TYPE.heading - 12, fontWeight: 700, color: "#fff" }}>
              450-12-8899
            </span>

            {/* The Black Box Drawn On Top */}
            <div style={{
              position: "absolute",
              top: 8, left: 14,
              width: 260 * blackBoxIn,
              height: 44,
              background: "#000000",
              border: "1px solid #334155",
              borderRadius: 4,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              {blackBoxIn > 0.8 && (
                <span style={{ fontSize: 13, fontFamily: MONO, color: "#64748B", opacity: 0.8 }}>VISUAL BLACKOUT</span>
              )}
            </div>

            {/* X-Ray Stream Inspector Callout */}
            {xrayIn > 0 && (
              <div style={{
                position: "absolute",
                right: 20,
                opacity: xrayIn,
                transform: `translateX(${(1 - xrayIn) * 20}px)`,
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid #EF4444",
                padding: "8px 16px",
                borderRadius: 8,
              }}>
                <span style={{ color: C.red, fontSize: 18 }}>⚠️</span>
                <span style={{ fontFamily: MONO, fontSize: TYPE.small - 4, color: "#FCA5A5", fontWeight: 700 }}>
                  RAW STREAM STILL CONTAINS: /Widget /V (450-12-8899)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Warning Footer */}
        <div style={{
          opacity: alertIn,
          transform: `translateY(${(1 - alertIn) * 10}px)`,
          background: "rgba(239, 68, 68, 0.12)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          padding: "14px 20px",
          borderRadius: 8,
          fontSize: TYPE.small,
          color: "#FCA5A5",
          fontWeight: 600,
        }}>
          ❌ {story.trap.warning}
        </div>
      </div>

      <div style={{ height: 20 }} />
    </AbsoluteFill>
  );
};
