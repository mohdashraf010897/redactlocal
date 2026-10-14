import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "../engine";
import { READ } from "../kit/film";
import { C, FONT, MONO, SHADOW, TYPE } from "../kit/theme";
import { Caption, Card, Headline, sp } from "../kit/ui";
import { Icon } from "../kit/icons";
import { story } from "../story";
import { Mark } from "./Title";

const CAPTION_AT = 75;
export const CLOSING_LEN = CAPTION_AT + 15 + READ; // 210 frames

export const Closing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = sp(frame, fps, 0, 20);
  const card1 = sp(frame, fps, 14, 18);
  const card2 = sp(frame, fps, 26, 18);
  const card3 = sp(frame, fps, 38, 18);
  const cta = sp(frame, fps, 54, 18);
  const caption = sp(frame, fps, CAPTION_AT, 20);

  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: C.ink }}>
      <Headline kicker={story.closing.kicker} title={story.closing.title} enter={title} />

      {/* 3 Summary Value Proposition Cards */}
      <div style={{ position: "absolute", left: 140, top: 290, width: 1640, display: "flex", gap: 32 }}>
        {/* Card 1: Pricing Arbitrage */}
        <Card
          style={{
            position: "relative",
            flex: 1,
            height: 440,
            padding: "44px 36px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            opacity: card1,
            transform: `translateY(${(1 - card1) * 30}px)`,
            border: "1px solid #BBF7D0",
            background: "#F0FDF4",
          }}
        >
          <div>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "#DCFCE7",
                color: C.accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
              }}
            >
              <Icon name="bolt" size={32} />
            </div>
            <div style={{ fontSize: 76, fontWeight: 800, color: C.accent, letterSpacing: "-.03em" }}>
              $39
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: C.ink, marginTop: 12 }}>
              One-Time License
            </div>
          </div>
          <div style={{ fontSize: 20, color: C.dim, fontFamily: MONO, borderTop: "1px solid #DCFCE7", paddingTop: 16 }}>
            Eliminates Adobe's $239.88/yr subscription tax forever.
          </div>
        </Card>

        {/* Card 2: 3 Proven Verticals */}
        <Card
          style={{
            position: "relative",
            flex: 1,
            height: 440,
            padding: "44px 36px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            opacity: card2,
            transform: `translateY(${(1 - card2) * 30}px)`,
            border: "1px solid #E2E8F0",
            background: "#FFFFFF",
          }}
        >
          <div>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "#EFF6FF",
                color: "#2563EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
              }}
            >
              <Icon name="file" size={32} />
            </div>
            <div style={{ fontSize: 76, fontWeight: 800, color: "#1E293B", letterSpacing: "-.03em" }}>
              3 Niches
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: C.ink, marginTop: 12 }}>
              Universal Demand
            </div>
          </div>
          <div style={{ fontSize: 20, color: C.dim, fontFamily: MONO, borderTop: "1px solid #F1F5F9", paddingTop: 16 }}>
            Legal Court Filings · Wire Invoices · HIPAA Healthcare Records.
          </div>
        </Card>

        {/* Card 3: Zero Infrastructure */}
        <Card
          style={{
            position: "relative",
            flex: 1,
            height: 440,
            padding: "44px 36px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            opacity: card3,
            transform: `translateY(${(1 - card3) * 30}px)`,
            border: "1px solid #E2E8F0",
            background: "#FFFFFF",
          }}
        >
          <div>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "#FEF3C7",
                color: "#D97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
              }}
            >
              <Icon name="shield" size={32} />
            </div>
            <div style={{ fontSize: 76, fontWeight: 800, color: "#1E293B", letterSpacing: "-.03em" }}>
              $0
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: C.ink, marginTop: 12 }}>
              Monthly Cloud Cost
            </div>
          </div>
          <div style={{ fontSize: 20, color: C.dim, fontFamily: MONO, borderTop: "1px solid #F1F5F9", paddingTop: 16 }}>
            100% Client-Side WebAssembly · Zero database maintenance.
          </div>
        </Card>
      </div>

      {/* Floating CTA Badge */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 780,
          display: "flex",
          justifyContent: "center",
          opacity: cta,
          transform: `translateY(${(1 - cta) * 16}px)`,
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 26,
            fontWeight: 800,
            background: "#FFFFFF",
            color: C.accent,
            borderRadius: 999,
            padding: "16px 44px",
            boxShadow: SHADOW,
            border: "2px solid #A7F3D0",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <Mark size={36} />
          <span>{story.closing.cta}</span>
        </div>
      </div>

      <Caption enter={caption}>{story.closing.caption}</Caption>
    </AbsoluteFill>
  );
};
