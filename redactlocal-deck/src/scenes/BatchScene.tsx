import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "../engine";
import { C, FONT, MONO, TYPE, SHADOW } from "../kit/theme";
import { sp } from "../kit/ui";
import { story } from "../story";

export const BATCH_LEN = 250; // 8.3 seconds

export const BatchScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = sp(frame, fps, 6, 18);
  const toolbarIn = sp(frame, fps, 24, 18);
  const progressIn = sp(frame, fps, 80, 40); // sweeps progress to 100%
  const exportIn = sp(frame, fps, 130, 20);
  const benchIn = sp(frame, fps, 150, 20);

  return (
    <AbsoluteFill style={{ fontFamily: FONT, background: C.bg, color: C.ink, padding: "50px 80px", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      
      {/* Header */}
      <div style={{ opacity: titleIn, transform: `translateY(${(1 - titleIn) * 16}px)` }}>
        <div style={{ fontFamily: MONO, fontSize: TYPE.kicker - 8, color: C.green, fontWeight: 700, letterSpacing: ".12em", marginBottom: 6 }}>
          {story.batch.kicker}
        </div>
        <div style={{ fontSize: TYPE.title - 14, fontWeight: 800, letterSpacing: "-.02em", color: C.ink }}>
          {story.batch.title}
        </div>
        <div style={{ fontSize: TYPE.heading - 16, color: C.dim, marginTop: 4 }}>
          {story.batch.subtitle}
        </div>
      </div>

      {/* Interactive Batch Workstation Window */}
      <div style={{
        background: C.card,
        border: `1px solid ${C.line}`,
        borderRadius: 18,
        padding: "26px 30px",
        boxShadow: SHADOW,
        opacity: toolbarIn,
        transform: `translateY(${(1 - toolbarIn) * 16}px)`,
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}>
        {/* Action Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.line}`, paddingBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.dim }}>PROFILE:</span>
            <span style={{ fontSize: 13, fontFamily: MONO, background: "#020617", color: "#38BDF8", padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.line}`, fontWeight: 600 }}>
              FRCP 5.2 Court Standard
            </span>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{
              background: progressIn >= 0.9 ? "#059669" : C.accent,
              color: "#ffffff",
              padding: "8px 18px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              ⚡ {progressIn >= 0.9 ? "All 5 Redacted" : "Redact All (5)"}
            </div>
            {exportIn > 0.1 && (
              <div style={{ display: "flex", gap: 10, opacity: exportIn }}>
                <span style={{ fontSize: 12, background: "#020617", border: `1px solid ${C.line}`, padding: "6px 12px", borderRadius: 8, color: C.green, fontWeight: 700, fontFamily: MONO }}>
                  {story.batch.exportZip}
                </span>
                <span style={{ fontSize: 12, background: "#020617", border: `1px solid ${C.line}`, padding: "6px 12px", borderRadius: 8, color: "#38BDF8", fontWeight: 700, fontFamily: MONO }}>
                  {story.batch.exportCsv}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ width: "100%", height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progressIn * 100}%`, background: C.green, borderRadius: 4 }} />
        </div>

        {/* Table Rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {story.batch.items.map((doc, idx) => {
            const rowIn = sp(frame, fps, 30 + idx * 8, 14);
            const isDone = progressIn > (0.2 + idx * 0.15);
            return (
              <div
                key={doc.name}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 18px",
                  background: isDone ? "rgba(16, 185, 129, 0.08)" : "#020617",
                  border: `1px solid ${isDone ? "rgba(16, 185, 129, 0.35)" : C.line}`,
                  borderRadius: 10,
                  opacity: rowIn,
                  transform: `translateY(${(1 - rowIn) * 10}px)`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 18 }}>📄</span>
                  <span style={{ fontSize: 15, fontFamily: MONO, fontWeight: 600, color: C.ink }}>
                    {doc.name}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <span style={{ fontSize: 14, color: C.dim }}>{doc.pages}</span>
                  <span style={{ fontSize: 13, fontFamily: MONO, color: "#F87171", background: "rgba(248,113,113,0.15)", padding: "3px 8px", borderRadius: 6, fontWeight: 700 }}>
                    {doc.pii}
                  </span>
                  <span style={{
                    fontSize: 13,
                    fontFamily: MONO,
                    fontWeight: 700,
                    color: isDone ? C.green : C.amber,
                    background: isDone ? "rgba(16, 185, 129, 0.18)" : "rgba(245, 158, 11, 0.18)",
                    padding: "4px 10px",
                    borderRadius: 6,
                  }}>
                    {isDone ? "✓ 100% CLEAN" : "QUEUED"}
                  </span>
                  <span style={{ fontSize: 13, color: "#38BDF8", fontWeight: 700, cursor: "pointer", background: "rgba(56, 189, 248, 0.12)", padding: "4px 12px", borderRadius: 6, border: "1px solid rgba(56, 189, 248, 0.25)" }}>
                    Inspect 🔍
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Speed & Compliance Line */}
      <div style={{
        opacity: benchIn,
        transform: `translateY(${(1 - benchIn) * 12}px)`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "#020617",
        border: `1px solid ${C.line}`,
        borderRadius: 10,
        padding: "12px 20px",
      }}>
        <div style={{ fontFamily: MONO, fontSize: 13, color: C.green, fontWeight: 700 }}>
          {story.batch.speed}
        </div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: C.dim }}>
          AIR-GAPPED MULTI-THREAD WASM BATCH PIPELINE
        </div>
      </div>

    </AbsoluteFill>
  );
};
