import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "../engine";
import { READ, useHandingOff } from "../kit/film";
import { C, FONT, MONO, TYPE } from "../kit/theme";
import { Caption, Card, Headline, Rect, glide, lerpRect, sp } from "../kit/ui";
import { Icon } from "../kit/icons";
import { story } from "../story";
import { LEAK_DOC } from "./Leak";
import { DocumentCard } from "./DocumentCard";

// Left-docked document rect in Purge
export const PURGED_DOC: Rect = { x: 140, y: 310, w: 740, h: 460 };
const STREAM_CARD: Rect = { x: 920, y: 310, w: 860, h: 460 };

const CAPTION_AT = 85;
export const PURGE_LEN = CAPTION_AT + 15 + READ; // 220 frames

export const Purge: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const handing = useHandingOff();

  const move = glide(frame, 0, 35);
  const currentDocRect = lerpRect(LEAK_DOC, PURGED_DOC, move);

  const title = sp(frame, fps, 10, 20);
  const streamIn = sp(frame, fps, 30, 18);
  const purgedState = frame >= 45;
  const badgeIn = sp(frame, fps, 65, 16);
  const caption = sp(frame, fps, CAPTION_AT, 20);

  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: C.ink }}>
      <Headline kicker={story.purge.kicker} title={story.purge.title} enter={title} />

      {/* Morphing Document on Left (transitions to purged state) */}
      <div style={{ opacity: handing ? 0 : 1 }}>
        <DocumentCard
          r={currentDocRect}
          purged={purgedState}
          badgeText={purgedState ? "PERMANENTLY SANITIZED" : "STREAM PURGING"}
          badgeTone={purgedState ? "good" : "neutral"}
        />
      </div>

      {/* Right Card: PDF Byte Stream Inspector */}
      <Card
        style={{
          position: "absolute",
          left: STREAM_CARD.x,
          top: STREAM_CARD.y,
          width: STREAM_CARD.w,
          height: STREAM_CARD.h,
          padding: "36px 40px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          opacity: streamIn,
          transform: `translateX(${(1 - streamIn) * 30}px)`,
          background: "#0F172A",
          color: "#F8FAFC",
          border: "1px solid #1E293B",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: C.accent }}>
              <Icon name="code" size={24} />
              <span style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, letterSpacing: ".08em" }}>
                INTERNAL PDF CONTENT STREAM
              </span>
            </div>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 16,
                color: "#94A3B8",
                background: "rgba(255,255,255,0.08)",
                padding: "4px 12px",
                borderRadius: 6,
              }}
            >
              pdf-lib WebWorker
            </div>
          </div>

          <div
            style={{
              fontFamily: MONO,
              fontSize: 20,
              lineHeight: 1.8,
              background: "#020617",
              padding: "20px 24px",
              borderRadius: 12,
              border: "1px solid #1E293B",
            }}
          >
            <div style={{ color: "#64748B" }}>{"// 1. Identify text glyph stream in /Contents"}</div>
            <div style={{ color: "#38BDF8" }}>BT /F1 12 Tf</div>
            <div style={{ color: "#F8FAFC" }}>&nbsp;&nbsp;(Social Security Number: ) Tj</div>
            <div
              style={{
                background: purgedState ? "rgba(220, 38, 38, 0.2)" : "transparent",
                color: purgedState ? "#F87171" : "#F8FAFC",
                textDecoration: purgedState ? "line-through" : "none",
                padding: "2px 6px",
                borderRadius: 4,
              }}
            >
              - (942-01-4491) Tj
              {purgedState && (
                <span style={{ color: "#EF4444", textDecoration: "none", marginLeft: 16, fontSize: 16 }}>
                  [GLYPH DELETED]
                </span>
              )}
            </div>
            <div
              style={{
                background: purgedState ? "rgba(16, 185, 129, 0.2)" : "transparent",
                color: purgedState ? "#34D399" : "#64748B",
                padding: "2px 6px",
                borderRadius: 4,
              }}
            >
              + 0 0 0 rg 284 710 92 14 re f
              {purgedState && (
                <span style={{ color: "#10B981", marginLeft: 16, fontSize: 16 }}>
                  [RASTER MASK APPLIED]
                </span>
              )}
            </div>
            <div style={{ color: "#38BDF8" }}>ET</div>
          </div>
        </div>

        {/* Verification Pill */}
        <div
          style={{
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            borderRadius: 12,
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            opacity: badgeIn,
          }}
        >
          <div style={{ color: C.green }}>
            <Icon name="check" size={24} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#6EE7B7" }}>
            {story.purge.badge}
          </div>
        </div>
      </Card>

      <Caption enter={caption}>{story.purge.caption}</Caption>
    </AbsoluteFill>
  );
};
