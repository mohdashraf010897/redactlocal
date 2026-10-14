import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "../engine";
import { READ, useHandingOff } from "../kit/film";
import { C, FONT, MONO, TYPE } from "../kit/theme";
import { Caption, Headline, Rect, glide, lerpRect, sp } from "../kit/ui";
import { Icon } from "../kit/icons";
import { story } from "../story";
import { TARGET_DOC } from "./Trap";
import { DocumentCard } from "./DocumentCard";

// Center-stage expanded document rect
export const LEAK_DOC: Rect = { x: 420, y: 260, w: 1080, h: 460 };

const CAPTION_AT = 95;
export const LEAK_LEN = CAPTION_AT + 15 + READ; // 230 frames

export const Leak: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const handing = useHandingOff();

  const move = glide(frame, 0, 35);
  const currentRect = lerpRect(TARGET_DOC, LEAK_DOC, move);

  const title = sp(frame, fps, 10, 20);
  const boxIn = frame >= 38;
  const selected = frame >= 62;
  const alertIn = sp(frame, fps, 76, 16);
  const caption = sp(frame, fps, CAPTION_AT, 20);

  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: C.ink }}>
      <Headline kicker={story.leak.kicker} title={story.leak.title} enter={title} />

      {/* Hero Document Morphing into Focus */}
      <div style={{ opacity: handing ? 0 : 1 }}>
        <DocumentCard
          r={currentRect}
          boxDrawn={boxIn}
          selectedText={selected}
          badgeText={selected ? "DATA EXPOSED" : "SENSITIVE PII"}
          badgeTone={selected ? "bad" : "neutral"}
        />
      </div>

      {/* Clean Red Warning Banner Below Document */}
      <div
        style={{
          position: "absolute",
          left: 420,
          top: 746,
          width: 1080,
          boxSizing: "border-box",
          opacity: handing ? 0 : alertIn,
          transform: `translateY(${(1 - alertIn) * 16}px)`,
          background: "#FEF2F2",
          border: "2px solid #DC2626",
          borderRadius: 16,
          padding: "16px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 10px 25px -5px rgba(220, 38, 38, 0.18)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "#DC2626",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="alert" size={26} />
          </div>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 700, color: "#DC2626" }}>
              {story.leak.warning}
            </div>
            <div style={{ fontSize: 18, color: C.dim, marginTop: 2 }}>
              Anyone can highlight, copy, and paste the characters hidden underneath.
            </div>
          </div>
        </div>

        <div
          style={{
            fontFamily: MONO,
            fontSize: 16,
            fontWeight: 700,
            background: "#FCA5A5",
            color: "#7F1D1D",
            padding: "6px 14px",
            borderRadius: 8,
          }}
        >
          FAIL: VISUAL MASK ONLY
        </div>
      </div>

      <Caption enter={caption}>{story.leak.caption}</Caption>
    </AbsoluteFill>
  );
};
