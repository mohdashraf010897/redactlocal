import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "../engine";
import { READ, useHandingOff } from "../kit/film";
import { C, FONT, MONO, TYPE } from "../kit/theme";
import { Caption, Card, Headline, Rect, glide, lerpRect, sp } from "../kit/ui";
import { Icon } from "../kit/icons";
import { story } from "../story";
import { PURGED_DOC } from "./Purge";
import { DocumentCard } from "./DocumentCard";

const DOCK_PREVIEW: Rect = { x: 140, y: 310, w: 540, h: 450 };
const CAPTION_AT = 75;
export const ECONOMICS_LEN = CAPTION_AT + 15 + READ; // 210 frames

export const Economics: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const handing = useHandingOff();

  const move = glide(frame, 0, 35);
  const currentDocRect = lerpRect(PURGED_DOC, DOCK_PREVIEW, move);

  const title = sp(frame, fps, 10, 20);
  const caption = sp(frame, fps, CAPTION_AT, 20);

  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: C.ink }}>
      <Headline kicker={story.economics.kicker} title={story.economics.title} enter={title} />

      {/* Docked Document on Left */}
      <div style={{ opacity: handing ? 0 : 1 }}>
        <DocumentCard r={currentDocRect} purged={true} badgeText="VERIFIED SAFE" badgeTone="good" />
      </div>

      {/* 3 Metric Cards on Right */}
      <div style={{ position: "absolute", left: 720, top: 310, width: 1060, display: "flex", gap: 24 }}>
        {story.economics.metrics.map((m, i) => {
          const s = sp(frame, fps, 20 + i * 14, 18);
          return (
            <Card
              key={i}
              style={{
                position: "relative",
                flex: 1,
                height: 450,
                padding: "36px 28px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                opacity: s,
                transform: `translateY(${(1 - s) * 30}px)`,
                border: "1px solid rgba(15, 23, 42, 0.08)",
                background: i === 0 ? "#F0FDF4" : "#FFFFFF",
              }}
            >
              <div>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: i === 0 ? "#DCFCE7" : "#F1F5F9",
                    color: i === 0 ? C.accent : C.ink,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                  }}
                >
                  <Icon name={m.icon} size={28} />
                </div>
                <div
                  style={{
                    fontSize: 68,
                    fontWeight: 800,
                    color: i === 0 ? C.accent : C.ink,
                    letterSpacing: "-.03em",
                    lineHeight: 1.1,
                  }}
                >
                  {m.num}
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, marginTop: 12, color: C.ink }}>
                  {m.label}
                </div>
              </div>

              <div
                style={{
                  fontSize: 18,
                  color: C.dim,
                  lineHeight: 1.4,
                  borderTop: "1px solid rgba(15, 23, 42, 0.06)",
                  paddingTop: 16,
                  fontFamily: MONO,
                }}
              >
                {m.sub}
              </div>
            </Card>
          );
        })}
      </div>

      <Caption enter={caption}>{story.economics.caption}</Caption>
    </AbsoluteFill>
  );
};
