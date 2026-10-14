import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "../engine";
import { READ, useHandingOff } from "../kit/film";
import { C, FONT, MONO, TYPE } from "../kit/theme";
import { Caption, Card, Headline, Rect, sp } from "../kit/ui";
import { Icon } from "../kit/icons";
import { story } from "../story";
import { DocumentCard } from "./DocumentCard";

// Center-docked document rect in Trap. The next scene (Leak) morphs from here!
export const TARGET_DOC: Rect = { x: 650, y: 310, w: 620, h: 460 };

const CAPTION_AT = 75;
export const TRAP_LEN = CAPTION_AT + 15 + READ; // 210 frames

export const Trap: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const handing = useHandingOff();

  const title = sp(frame, fps, 0, 20);
  const left = sp(frame, fps, 10, 18);
  const doc = sp(frame, fps, 24, 18);
  const right = sp(frame, fps, 38, 18);
  const caption = sp(frame, fps, CAPTION_AT, 20);

  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: C.ink }}>
      <Headline kicker={story.trap.kicker} title={story.trap.title} enter={title} />

      {/* Left Card: Adobe Acrobat Subscription Trap */}
      <Card
        style={{
          position: "absolute",
          left: 130,
          top: 310,
          width: 480,
          height: 460,
          padding: "36px 32px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          opacity: left,
          transform: `translateX(${(1 - left) * -30}px)`,
          border: "1px solid #FECACA",
          background: "#FEF2F2",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: C.red }}>
            <Icon name="cross" size={24} />
            <span style={{ fontFamily: MONO, fontSize: TYPE.small, fontWeight: 700, letterSpacing: ".06em" }}>
              SUBSCRIPTION TRAP
            </span>
          </div>
          <div style={{ fontSize: TYPE.heading, fontWeight: 800, marginTop: 14, color: C.ink }}>
            {story.trap.adobe.title}
          </div>
          <div style={{ fontSize: 64, fontWeight: 800, color: C.red, letterSpacing: "-.03em", marginTop: 10 }}>
            {story.trap.adobe.price}
          </div>
          <div style={{ fontSize: TYPE.small + 2, color: C.dim, marginTop: 8, lineHeight: 1.4 }}>
            {story.trap.adobe.note}
          </div>
        </div>

        <div
          style={{
            background: "#FFFFFF",
            padding: "12px 18px",
            borderRadius: 12,
            border: "1px solid #FCA5A5",
            fontSize: 20,
            fontWeight: 600,
            color: C.red,
          }}
        >
          Mandatory $20/mo annual contract
        </div>
      </Card>

      {/* Center Hero Card: Confidential Document */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: handing ? 0 : doc,
          transform: `translateY(${(1 - doc) * 30}px)`,
        }}
      >
        <DocumentCard r={TARGET_DOC} />
      </div>

      {/* Right Card: Free Cloud Uploader Privacy Danger */}
      <Card
        style={{
          position: "absolute",
          left: 1310,
          top: 310,
          width: 480,
          height: 460,
          padding: "36px 32px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          opacity: right,
          transform: `translateX(${(1 - right) * 30}px)`,
          border: "1px solid #FED7AA",
          background: "#FFF7ED",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: C.amber }}>
            <Icon name="alert" size={24} />
            <span style={{ fontFamily: MONO, fontSize: TYPE.small, fontWeight: 700, letterSpacing: ".06em" }}>
              PRIVACY BREACH
            </span>
          </div>
          <div style={{ fontSize: TYPE.heading, fontWeight: 800, marginTop: 14, color: C.ink }}>
            {story.trap.cloud.title}
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: C.amber, marginTop: 14, lineHeight: 1.3 }}>
            {story.trap.cloud.warning}
          </div>
          <div style={{ fontSize: TYPE.small + 2, color: C.dim, marginTop: 12, lineHeight: 1.4 }}>
            {story.trap.cloud.risk}
          </div>
        </div>

        <div
          style={{
            background: "#FFFFFF",
            padding: "12px 18px",
            borderRadius: 12,
            border: "1px solid #FDBA74",
            fontSize: 20,
            fontWeight: 600,
            color: C.amber,
          }}
        >
          Unacceptable for legal & medical files
        </div>
      </Card>

      <Caption enter={caption}>{story.trap.caption}</Caption>
    </AbsoluteFill>
  );
};
