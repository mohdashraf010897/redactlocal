import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "../engine";
import { READ, useHandingOff } from "../kit/film";
import { C, FONT, MONO, TYPE } from "../kit/theme";
import { Caption, Cursor, Headline, ramp, sp } from "../kit/ui";
import { Icon } from "../kit/icons";
import { BrowserWindow } from "../kit/screens";
import { story } from "../story";
import { BROWSER_RECT } from "./Install";

const CAPTION_AT = 95;
export const LEGAL_LEN = CAPTION_AT + 15 + READ; // 230 frames

export const LegalCase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const handing = useHandingOff();

  const title = sp(frame, fps, 0, 20);
  const caption = sp(frame, fps, CAPTION_AT, 20);

  // Interaction timing
  const clickFrame = 58;
  const cursorT = ramp(frame, 15, clickFrame);
  // Cursor moves onto the "Purge Stream Glyphs" button in sidebar (x: ~1620, y: ~680)
  const cursorX = 1760 - (1760 - 1620) * cursorT;
  const cursorY = 820 - (820 - 670) * cursorT;
  const isPressed = frame >= clickFrame && frame <= clickFrame + 8 ? 1 : 0;
  const isPurged = frame >= clickFrame + 6;

  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: C.ink }}>
      <Headline kicker={story.legal.kicker} title={story.legal.title} enter={title} />

      <div style={{ opacity: handing ? 0 : 1 }}>
        <BrowserWindow r={BROWSER_RECT} url={story.legal.url} scale={1}>
          <div style={{ display: "flex", height: "100%", background: "#F1F5F9" }}>
            {/* Main PDF Viewer Pane (Left) */}
            <div
              style={{
                flex: 1,
                padding: "36px 48px",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* PDF Document Paper Sheet */}
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: 12,
                  boxShadow: "0 4px 20px rgba(15, 23, 42, 0.08)",
                  border: "1px solid #CBD5E1",
                  padding: "36px 44px",
                  height: "100%",
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderBottom: "2px solid #E2E8F0",
                      paddingBottom: 16,
                      marginBottom: 20,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: C.ink }}>
                        {story.legal.docType}
                      </div>
                      <div style={{ fontSize: 16, color: C.dim, fontFamily: MONO, marginTop: 4 }}>
                        {story.legal.ref}
                      </div>
                    </div>
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 14,
                        fontWeight: 700,
                        background: isPurged ? "#D1FAE5" : "#FEF3C7",
                        color: isPurged ? C.green : C.amber,
                        padding: "6px 14px",
                        borderRadius: 999,
                      }}
                    >
                      {isPurged ? "✓ SANITIZED (ZERO LEAKS)" : "● CONTAINS DETECTED PII"}
                    </span>
                  </div>

                  {/* Document Body Lines */}
                  <div style={{ fontFamily: MONO, fontSize: 20, lineHeight: 2.0, color: C.ink }}>
                    <div>Party in Matter: <span style={{ fontWeight: 600 }}>Jane Doe (Material Witness)</span></div>

                    {/* Sensitive SSN Line */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span>Social Security:</span>
                      {isPurged ? (
                        <span
                          style={{
                            background: "#0F172A",
                            color: "#34D399",
                            padding: "2px 14px",
                            borderRadius: 4,
                            fontWeight: 700,
                            letterSpacing: ".06em",
                          }}
                        >
                          {story.legal.purged}
                        </span>
                      ) : (
                        <span
                          style={{
                            background: "#FEF08A",
                            color: "#854D0E",
                            padding: "2px 8px",
                            borderRadius: 4,
                            fontWeight: 700,
                          }}
                        >
                          942-01-4491
                        </span>
                      )}
                    </div>

                    {/* Sensitive Email Line */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span>Contact Email:</span>
                      {isPurged ? (
                        <span
                          style={{
                            background: "#0F172A",
                            color: "#34D399",
                            padding: "2px 14px",
                            borderRadius: 4,
                            fontWeight: 700,
                            letterSpacing: ".06em",
                          }}
                        >
                          {story.legal.purged}
                        </span>
                      ) : (
                        <span
                          style={{
                            background: "#FEF08A",
                            color: "#854D0E",
                            padding: "2px 8px",
                            borderRadius: 4,
                            fontWeight: 700,
                          }}
                        >
                          jdoe@private-practice.law
                        </span>
                      )}
                    </div>

                    <div style={{ marginTop: 12, color: C.dim, fontSize: 16 }}>
                      Court Declaration: Protective order restricts disclosure of personal identifiers under Rule 5.2.
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    borderTop: "1px solid #E2E8F0",
                    paddingTop: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 14,
                    color: C.dim,
                    fontFamily: MONO,
                  }}
                >
                  <span>Page 1 of 6 · court_verified</span>
                  <span>Local PDF.js Renderer (No network)</span>
                </div>
              </div>
            </div>

            {/* RedactLocal Floating Extension Drawer (Right) */}
            <div
              style={{
                width: 440,
                background: "#0F172A",
                color: "#F8FAFC",
                borderLeft: "1px solid #1E293B",
                padding: "32px 28px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxSizing: "border-box",
              }}
            >
              <div>
                {/* Drawer Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: "#059669",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: 16,
                      }}
                    >
                      RL
                    </div>
                    <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-.01em" }}>
                      RedactLocal
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 12,
                      color: "#34D399",
                      background: "rgba(52, 211, 153, 0.15)",
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontWeight: 700,
                    }}
                  >
                    OFFLINE ACTIVE
                  </span>
                </div>

                {/* Detection Card */}
                <div
                  style={{
                    background: "#1E293B",
                    borderRadius: 12,
                    padding: "20px 18px",
                    border: "1px solid #334155",
                    marginBottom: 20,
                  }}
                >
                  <div style={{ fontSize: 14, fontFamily: MONO, color: "#94A3B8", marginBottom: 10 }}>
                    AUTOMATED SCAN
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#F8FAFC", marginBottom: 12 }}>
                    {isPurged ? "2 Tokens Purged" : story.legal.detected}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 15, fontFamily: MONO }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#E2E8F0" }}>
                      <span>✓ US SSN (9 Digits)</span>
                      <span style={{ color: isPurged ? "#34D399" : "#F59E0B" }}>{isPurged ? "Deleted" : "Tagged"}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#E2E8F0" }}>
                      <span>✓ Email Address</span>
                      <span style={{ color: isPurged ? "#34D399" : "#F59E0B" }}>{isPurged ? "Deleted" : "Tagged"}</span>
                    </div>
                  </div>
                </div>

                {/* Network Sentinel */}
                <div
                  style={{
                    fontSize: 14,
                    color: "#94A3B8",
                    fontFamily: MONO,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "rgba(0,0,0,0.25)",
                    padding: "10px 14px",
                    borderRadius: 8,
                  }}
                >
                  <Icon name="shield" size={18} color="#34D399" />
                  <span>Network Guard: 0 bytes sent</span>
                </div>
              </div>

              {/* Action Button */}
              <div
                style={{
                  background: isPurged ? "#059669" : "#2563EB",
                  color: "#FFFFFF",
                  borderRadius: 12,
                  padding: "16px 20px",
                  textAlign: "center",
                  fontSize: 18,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  transform: `scale(${1 - 0.04 * isPressed})`,
                  boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
                }}
              >
                <Icon name={isPurged ? "check" : "bolt"} size={22} />
                {isPurged ? "Stream Cleaned" : "Purge Stream Glyphs"}
              </div>
            </div>
          </div>
        </BrowserWindow>

        {/* Animated Mouse Cursor clicking the Purge button */}
        {!isPurged && (
          <Cursor x={cursorX} y={cursorY} press={isPressed} />
        )}
      </div>

      <Caption enter={caption}>{story.legal.caption}</Caption>
    </AbsoluteFill>
  );
};
