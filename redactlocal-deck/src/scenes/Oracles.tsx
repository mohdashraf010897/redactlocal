import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "../engine";
import { C, FONT, MONO, TYPE, SHADOW } from "../kit/theme";
import { sp } from "../kit/ui";
import { story } from "../story";

export const ORACLES_LEN = 270; // 9.0 seconds

export const Oracles: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = sp(frame, fps, 6, 18);
  const receiptIn = sp(frame, fps, 150, 22);

  return (
    <AbsoluteFill style={{ fontFamily: FONT, background: C.bg, color: C.ink, padding: "70px 100px", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      
      {/* Header */}
      <div style={{ opacity: titleIn, transform: `translateY(${(1 - titleIn) * 20}px)` }}>
        <div style={{ fontFamily: MONO, fontSize: TYPE.kicker - 8, color: "#38BDF8", fontWeight: 700, letterSpacing: ".12em", marginBottom: 6 }}>
          {story.oracles.kicker}
        </div>
        <div style={{ fontSize: TYPE.title - 14, fontWeight: 800, letterSpacing: "-.02em", color: C.ink }}>
          {story.oracles.title}
        </div>
        <div style={{ fontSize: TYPE.heading - 16, color: C.dim, marginTop: 6 }}>
          {story.oracles.subtitle}
        </div>
      </div>

      {/* Grid of 7 Oracles */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
        {story.oracles.oraclesList.map((item, idx) => {
          const itemIn = sp(frame, fps, 25 + idx * 16, 16);
          return (
            <div
              key={item.id}
              style={{
                background: C.card,
                border: `1px solid ${C.line}`,
                borderRadius: 12,
                padding: "14px 20px",
                boxShadow: SHADOW,
                opacity: itemIn,
                transform: `translateY(${(1 - itemIn) * 16}px)`,
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(16, 185, 129, 0.15)", color: C.green, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontFamily: MONO, fontSize: 13, flexShrink: 0 }}>
                ✓ {item.id}
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: TYPE.small - 4, fontWeight: 700, color: C.ink }}>
                  {item.label}
                </span>
                <span style={{ fontSize: TYPE.small - 8, color: C.dim }}>
                  {item.desc}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cryptographic Receipt Footer */}
      <div style={{
        opacity: receiptIn,
        transform: `translateY(${(1 - receiptIn) * 14}px)`,
        background: "rgba(16, 185, 129, 0.1)",
        border: "1px solid rgba(16, 185, 129, 0.3)",
        borderRadius: 12,
        padding: "16px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}>📜</span>
          <span style={{ fontFamily: MONO, fontSize: TYPE.small - 4, color: "#34D399", fontWeight: 700 }}>
            {story.oracles.receipt}
          </span>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 12, color: C.dim }}>
          COURT-ADMISSIBLE AUDIT LEDGER · ZERO RESIDUAL BYTES
        </div>
      </div>

    </AbsoluteFill>
  );
};
