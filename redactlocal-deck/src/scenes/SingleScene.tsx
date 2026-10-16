import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "../engine";
import { C, FONT, MONO, TYPE, SHADOW } from "../kit/theme";
import { sp } from "../kit/ui";
import { story } from "../story";

export const SINGLE_LEN = 280; // 9.3 seconds

export const SingleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = sp(frame, fps, 6, 18);
  const layoutIn = sp(frame, fps, 24, 20);
  const layerIn = sp(frame, fps, 60, 20);
  const oraclesIn = sp(frame, fps, 110, 25);
  const receiptIn = sp(frame, fps, 170, 20);

  return (
    <AbsoluteFill style={{ fontFamily: FONT, background: C.bg, color: C.ink, padding: "50px 80px", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      
      {/* Header */}
      <div style={{ opacity: titleIn, transform: `translateY(${(1 - titleIn) * 16}px)` }}>
        <div style={{ fontFamily: MONO, fontSize: TYPE.kicker - 8, color: "#38BDF8", fontWeight: 700, letterSpacing: ".12em", marginBottom: 6 }}>
          {story.single.kicker}
        </div>
        <div style={{ fontSize: TYPE.title - 14, fontWeight: 800, letterSpacing: "-.02em", color: C.ink }}>
          {story.single.title}
        </div>
        <div style={{ fontSize: TYPE.heading - 16, color: C.dim, marginTop: 4 }}>
          {story.single.subtitle}
        </div>
      </div>

      {/* 3-Column Studio Simulation */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "340px 1fr 340px",
        gap: 20,
        height: 520,
        opacity: layoutIn,
        transform: `translateY(${(1 - layoutIn) * 18}px)`,
      }}>
        
        {/* Col 1: Target PII Queue & 3 Layers */}
        <div style={{
          background: C.card,
          border: `1px solid ${C.line}`,
          borderRadius: 16,
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          boxShadow: SHADOW,
        }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>TARGET FIELDS (7)</span>
            <span style={{ fontSize: 11, fontFamily: MONO, color: C.green, background: "rgba(16,185,129,0.18)", padding: "3px 8px", borderRadius: 4, fontWeight: 700 }}>✓ ALL EXCISED</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, opacity: layerIn }}>
            {story.single.layers.map((l) => (
              <div key={l.id} style={{ background: "#020617", border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, fontFamily: MONO, fontWeight: 800, color: l.id === "L1" ? "#38BDF8" : (l.id === "L2" ? "#C084FC" : C.amber), background: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: 4 }}>
                    {l.id}
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: C.ink }}>{l.name}</span>
                </div>
                <div style={{ fontSize: 11, color: C.dim, lineHeight: 1.4 }}>{l.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "auto", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.35)", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: C.green, fontFamily: MONO, fontWeight: 700, textAlign: "center" }}>
            ⚡ 1.8ms per page · Wasm Engine
          </div>
        </div>

        {/* Col 2: Center Viewport with Blackout Excision */}
        <div style={{
          background: "#020617",
          border: `1px solid ${C.line}`,
          borderRadius: 16,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          boxShadow: SHADOW,
        }}>
          {/* Document Simulated Sheet */}
          <div style={{
            width: "90%",
            height: "94%",
            background: "#ffffff",
            borderRadius: 10,
            boxShadow: "0 14px 35px rgba(0,0,0,0.5)",
            padding: "28px 32px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            position: "relative",
          }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", textAlign: "center", borderBottom: "1px solid #E2E8F0", paddingBottom: 10 }}>
              CONFIDENTIAL SETTLEMENT AGREEMENT
            </div>

            <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.6 }}>
              This Agreement is entered into between Johnathan Doe ("Plaintiff") and Apex Logistics Global Corp ("Defendant").
            </div>

            {/* Redacted Line 1 (Valuation) */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "#334155" }}>
              <span style={{ fontWeight: 600 }}>Settlement Amount:</span>
              <span style={{ background: "#0F172A", color: "#0F172A", padding: "2px 48px", borderRadius: 4, userSelect: "none" }}>
                $4,750,000.00
              </span>
            </div>

            {/* Redacted Line 2 (Routing & Account) */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "#334155" }}>
              <span style={{ fontWeight: 600 }}>Routing / Account:</span>
              <span style={{ background: "#0F172A", color: "#0F172A", padding: "2px 34px", borderRadius: 4, userSelect: "none" }}>
                021000021
              </span>
              <span style={{ background: "#0F172A", color: "#0F172A", padding: "2px 42px", borderRadius: 4, userSelect: "none" }}>
                9928172645
              </span>
            </div>

            {/* Redacted Line 3 (SSN) */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "#334155" }}>
              <span style={{ fontWeight: 600 }}>Beneficiary SSN:</span>
              <span style={{ background: "#0F172A", color: "#0F172A", padding: "2px 38px", borderRadius: 4, userSelect: "none" }}>
                452-89-1029
              </span>
            </div>

            <div style={{ fontSize: 10.5, color: "#64748B", marginTop: "auto", borderTop: "1px solid #E2E8F0", paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
              <span>Page 1 of 4</span>
              <span style={{ color: "#059669", fontWeight: 700 }}>✓ RAW BYTECODE EXCISED (0 LEAKS)</span>
            </div>
          </div>
        </div>

        {/* Col 3: 7 Oracles Audit & Pass */}
        <div style={{
          background: C.card,
          border: `1px solid ${C.line}`,
          borderRadius: 16,
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          boxShadow: SHADOW,
        }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>7-ORACLE AUDIT</span>
            <span style={{ fontSize: 11, fontFamily: MONO, color: C.green, fontWeight: 700 }}>{story.single.oraclesPass}</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 7, opacity: oraclesIn }}>
            {["O1: Dual Parsers (PDF.js + pypdf)", "O2: Decompressed Bytecode Scanner", "O3: AcroForm /V & /XFA Purge", "O4: Raster Pixel Burnout", "O5: Collateral Damage Guard", "O6: Metadata & XMP Wipe", "O7: Fail-Closed Fuzzer Proof"].map((o) => (
              <div key={o} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "#020617", borderRadius: 8, border: `1px solid ${C.line}` }}>
                <span style={{ width: 18, height: 18, borderRadius: "50%", background: C.green, color: "#ffffff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 11, fontFamily: MONO, fontWeight: 600, color: C.ink }}>{o}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "auto", fontSize: 11, color: C.dim, fontFamily: MONO, textAlign: "center" }}>
            AUDITED BY MUPDF.JS + PYPDF
          </div>
        </div>

      </div>

      {/* Cryptographic Receipt Callout */}
      <div style={{
        opacity: receiptIn,
        transform: `translateY(${(1 - receiptIn) * 12}px)`,
        background: "rgba(16, 185, 129, 0.08)",
        border: "1px solid rgba(16, 185, 129, 0.25)",
        borderRadius: 10,
        padding: "12px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>📜</span>
          <span style={{ fontFamily: MONO, fontSize: 12.5, color: "#34D399", fontWeight: 700 }}>
            {story.single.receiptTitle}
          </span>
          <span style={{ fontSize: 11, color: C.dim }}>({story.single.receiptSha})</span>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: C.green, fontWeight: 700 }}>
          COURT-ADMISSIBLE AUDIT LEDGER
        </div>
      </div>

    </AbsoluteFill>
  );
};
