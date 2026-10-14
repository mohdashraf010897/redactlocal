import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "../engine";
import { READ, useHandingOff } from "../kit/film";
import { C, FONT, MONO, TYPE } from "../kit/theme";
import { Caption, Card, Cursor, Headline, Rect, ramp, sp } from "../kit/ui";
import { Icon } from "../kit/icons";
import { BrowserWindow } from "../kit/screens";
import { story } from "../story";
import { Mark } from "./Title";

export const BROWSER_RECT: Rect = { x: 140, y: 240, w: 1640, h: 710 };

const CAPTION_AT = 75;
export const INSTALL_LEN = CAPTION_AT + 15 + READ; // 210 frames

export const Install: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const handing = useHandingOff();

  const title = sp(frame, fps, 0, 20);
  const win = sp(frame, fps, 8, 18);
  const caption = sp(frame, fps, CAPTION_AT, 20);

  // Mouse cursor moves from bottom-right to the "Add to Chrome" button
  // Button sits around x: 1420, y: 390
  const clickFrame = 55;
  const cursorT = ramp(frame, 18, clickFrame);
  const cursorX = 1680 - (1680 - 1460) * cursorT;
  const cursorY = 700 - (700 - 410) * cursorT;
  const isPressed = frame >= clickFrame && frame <= clickFrame + 8 ? 1 : 0;
  const isInstalled = frame >= clickFrame + 6;
  const badgeGlow = ramp(frame, clickFrame + 12, clickFrame + 36);

  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: C.ink }}>
      <Headline kicker={story.install.kicker} title={story.install.title} enter={title} />

      <div style={{ opacity: handing ? 0 : win }}>
        <BrowserWindow r={BROWSER_RECT} url={story.install.url} scale={1}>
          {/* Chrome Web Store Header inside Browser */}
          <div
            style={{
              height: 70,
              background: "#FFFFFF",
              borderBottom: "1px solid #E2E8F0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 36px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "#4285F4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 16,
                }}
              >
                C
              </div>
              <span style={{ fontSize: 20, fontWeight: 700, color: "#1E293B" }}>
                chrome web store
              </span>
            </div>

            {/* Browser Toolbar with Extensions Slot */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontSize: 16, color: C.dim, fontFamily: MONO }}>Extensions</span>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  background: isInstalled ? "#ECFDF5" : "#F1F5F9",
                  border: isInstalled ? "2px solid #059669" : "1px solid #CBD5E1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: isInstalled ? `0 0 16px rgba(5, 150, 105, ${badgeGlow})` : "none",
                  transition: "all 0.3s ease",
                }}
              >
                {isInstalled ? (
                  <div style={{ color: C.accent, fontWeight: 800, fontSize: 18 }}>RL</div>
                ) : (
                  <Icon name="package" size={20} color={C.dim} />
                )}
              </div>
            </div>
          </div>

          {/* Web Store Listing Content Body */}
          <div
            style={{
              padding: "48px 60px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              background: "#F8FAFC",
              height: "calc(100% - 70px)",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
              <Mark size={110} />
              <div>
                <div style={{ fontSize: 36, fontWeight: 800, color: C.ink, letterSpacing: "-.02em" }}>
                  {story.install.extTitle}
                </div>
                <div style={{ fontSize: 20, color: C.dim, marginTop: 8, fontWeight: 500 }}>
                  {story.install.meta}
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 14,
                      fontWeight: 700,
                      background: "#ECFDF5",
                      color: C.accent,
                      padding: "4px 12px",
                      borderRadius: 6,
                      border: "1px solid #A7F3D0",
                    }}
                  >
                    ✓ 100% OFFLINE PRIVACY
                  </span>
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 14,
                      fontWeight: 700,
                      background: "#F1F5F9",
                      color: C.dim,
                      padding: "4px 12px",
                      borderRadius: 6,
                    }}
                  >
                    ZERO NETWORK REQUESTS
                  </span>
                </div>
              </div>
            </div>

            {/* Install Button */}
            <div
              style={{
                background: isInstalled ? "#059669" : "#1D4ED8",
                color: "#FFFFFF",
                fontSize: 22,
                fontWeight: 700,
                padding: "16px 36px",
                borderRadius: 12,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 12,
                boxShadow: "0 4px 14px rgba(29, 78, 216, 0.25)",
                transform: `scale(${1 - 0.05 * isPressed})`,
                transition: "background 0.2s ease, transform 0.1s ease",
              }}
            >
              <Icon name={isInstalled ? "check" : "download"} size={24} />
              {isInstalled ? story.install.btnDone : story.install.btn}
            </div>
          </div>
        </BrowserWindow>

        {/* Animated Mouse Cursor */}
        {!isInstalled && (
          <Cursor x={cursorX} y={cursorY} press={isPressed} />
        )}
      </div>

      <Caption enter={caption}>{story.install.caption}</Caption>
    </AbsoluteFill>
  );
};
