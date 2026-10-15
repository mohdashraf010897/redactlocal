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
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(59, 130, 246, 0.15)", color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, fontFamily: MONO }}>
            01
          </div>
          <div style={{ fontSize: TYPE.body - 4, fontWeight: 700, color: C.ink, marginTop: 4 }}>
            Bytecode Excision
          </div>
          <div style={{ fontSize: TYPE.small - 4, color: C.dim, lineHeight: 1.5 }}>
            Surgically replaces text operators <code style={{ fontFamily: MONO, color: "#38BDF8" }}>Tj</code> and <code style={{ fontFamily: MONO, color: "#38BDF8" }}>TJ</code> with whitespace in decompressed streams.
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
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(16, 185, 129, 0.15)", color: C.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, fontFamily: MONO }}>
            02
          </div>
          <div style={{ fontSize: TYPE.body - 4, fontWeight: 700, color: C.ink, marginTop: 4 }}>
            Raster Pixel Burnout
          </div>
          <div style={{ fontSize: TYPE.small - 4, color: C.dim, lineHeight: 1.5 }}>
            Destroys underlying image XObject pixels so scanned photos and OCR text cannot be recovered.
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
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(245, 158, 11, 0.15)", color: C.amber, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, fontFamily: MONO }}>
            03
          </div>
          <div style={{ fontSize: TYPE.body - 4, fontWeight: 700, color: C.ink, marginTop: 4 }}>
            XFA & Trailer Purge
          </div>
          <div style={{ fontSize: TYPE.small - 4, color: C.dim, lineHeight: 1.5 }}>
            Unlinks 11-stream XML arrays and rewrites the entire xref table with zero <code style={{ fontFamily: MONO, color: "#F59E0B" }}>/Prev</code> revision pointers.
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
