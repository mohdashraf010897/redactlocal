import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "../engine";
import { C, FONT, MONO, TYPE, SHADOW } from "../kit/theme";
import { sp } from "../kit/ui";
import { story } from "../story";

export const ENGINE_LEN = 250; // 8.3 seconds

export const Engine: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = sp(frame, fps, 6, 18);
  const step1In = sp(frame, fps, 30, 20);
  const step2In = sp(frame, fps, 70, 20);
  const step3In = sp(frame, fps, 110, 20);
  const statIn = sp(frame, fps, 150, 20);

  return (
    <AbsoluteFill style={{ fontFamily: FONT, background: C.bg, color: C.ink, padding: "80px 100px", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      
      {/* Header */}
      <div style={{ opacity: titleIn, transform: `translateY(${(1 - titleIn) * 20}px)` }}>
        <div style={{ fontFamily: MONO, fontSize: TYPE.kicker - 8, color: C.green, fontWeight: 700, letterSpacing: ".12em", marginBottom: 8 }}>
          {story.engine.kicker}
        </div>
        <div style={{ fontSize: TYPE.title - 12, fontWeight: 800, letterSpacing: "-.02em", color: C.ink }}>
          {story.engine.title}
        </div>
        <div style={{ fontSize: TYPE.heading - 14, color: C.dim, marginTop: 8 }}>
          {story.engine.subtitle}
        </div>
      </div>

      {/* 3 Step Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
        
        {/* Step 1 */}
        <div style={{
          background: C.card,
          border: `1px solid ${C.line}`,
          borderRadius: 16,
          padding: 28,
          boxShadow: SHADOW,
          opacity: step1In,
          transform: `translateY(${(1 - step1In) * 24}px)`,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(59, 130, 246, 0.15)", color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, fontFamily: MONO }}>
            L1
          </div>
          <div style={{ fontSize: TYPE.body - 4, fontWeight: 700, color: C.ink, marginTop: 4 }}>
            15 Statutory Formats
          </div>
          <div style={{ fontSize: TYPE.small - 4, color: C.dim, lineHeight: 1.5 }}>
            Deterministic precision across <code style={{ fontFamily: MONO, color: "#38BDF8" }}>PAN</code>, <code style={{ fontFamily: MONO, color: "#38BDF8" }}>Aadhaar</code>, <code style={{ fontFamily: MONO, color: "#38BDF8" }}>GSTIN</code>, <code style={{ fontFamily: MONO, color: "#38BDF8" }}>SSN</code>, Passports, IFSC &amp; Cards.
          </div>
        </div>

        {/* Step 2 */}
        <div style={{
          background: C.card,
          border: `1px solid ${C.line}`,
          borderRadius: 16,
          padding: 28,
          boxShadow: SHADOW,
          opacity: step2In,
          transform: `translateY(${(1 - step2In) * 24}px)`,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(168, 85, 247, 0.15)", color: "#A855F7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, fontFamily: MONO }}>
            L2
          </div>
          <div style={{ fontSize: TYPE.body - 4, fontWeight: 700, color: C.ink, marginTop: 4 }}>
            On-Device Semantic NER
          </div>
          <div style={{ fontSize: TYPE.small - 4, color: C.dim, lineHeight: 1.5 }}>
            Air-gapped NLP extracts unstructured patient/doctor names, street addresses, and clinical medical terms locally.
          </div>
        </div>

        {/* Step 3 */}
        <div style={{
          background: C.card,
          border: `1px solid ${C.line}`,
          borderRadius: 16,
          padding: 28,
          boxShadow: SHADOW,
          opacity: step3In,
          transform: `translateY(${(1 - step3In) * 24}px)`,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(245, 158, 11, 0.15)", color: C.amber, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, fontFamily: MONO }}>
            L3
          </div>
          <div style={{ fontSize: TYPE.body - 4, fontWeight: 700, color: C.ink, marginTop: 4 }}>
            User Free Will &amp; Discretion
          </div>
          <div style={{ fontSize: TYPE.small - 4, color: C.dim, lineHeight: 1.5 }}>
            Total human control: toggle any auto field on/off, click to draw manual boxes, with zero forced over-redaction.
          </div>
        </div>

      </div>

      {/* Speed & Benchmark Callout */}
      <div style={{
        opacity: statIn,
        transform: `translateY(${(1 - statIn) * 16}px)`,
        background: "#020617",
        border: `1px solid ${C.line}`,
        borderRadius: 12,
        padding: "18px 28px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div style={{ fontFamily: MONO, fontSize: TYPE.body - 4, color: C.green, fontWeight: 700 }}>
          {story.engine.speed}
        </div>
        <div style={{ fontFamily: MONO, fontSize: 13, color: C.dim }}>
          CLIENT-SIDE AIR-GAPPED BENCHMARK
        </div>
      </div>

    </AbsoluteFill>
  );
};
