import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "../../engine";
import { READ } from "../../kit/film";
import { C, FONT } from "../../kit/theme";
import { Bars, Caption, Card, Headline, ramp, sp } from "../../kit/ui";
import { story } from "../story";

const CAPTION_AT = 90;
export const NUMBERS_LEN = CAPTION_AT + 20 + READ;

export const Numbers: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const title = sp(frame, fps, 0, 20);
  const card = sp(frame, fps, 10, 18);
  const grow = ramp(frame, 24, 80);
  const caption = sp(frame, fps, CAPTION_AT, 20);
  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: C.ink }}>
      <Headline kicker={story.numbers.kicker} title={story.numbers.title} enter={title} />
      <Card style={{ left: 260, top: 340, width: 1400, height: 400, padding: "0 80px", display: "flex", alignItems: "center", opacity: card, transform: `translateY(${(1 - card) * 30}px)` }}>
        <Bars data={story.numbers.bars} t={grow} width={1240} unit={story.numbers.unit} />
      </Card>
      <Caption enter={caption}>{story.numbers.caption}</Caption>
    </AbsoluteFill>
  );
};
