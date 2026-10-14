import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "../engine";
import { Shot } from "../kit/film";
import { ICONS, Icon } from "../kit/icons";
import { BrowserWindow, ChatMessage, ChatWindow, LiftedMessage, Screenshot, Terminal, typedChars } from "../kit/screens";
import { C, FONT, TYPE } from "../kit/theme";
import { Caption, Card, Chip, Cursor, Headline, Rect, glide, lerpRect, ramp, sp } from "../kit/ui";
import { FanIn, StatusChip, TicketCard, column } from "../kit/flow";

// A tour of the kit's screen components. Not part of the film; delete this folder if you don't need it.

const Chat: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const msgs: ChatMessage[] = [
    { who: "Monitor", app: true, color: C.red, time: "9:02", text: "checkout-api error rate 4.8% (threshold 2%)" },
    { who: "Monitor", app: true, color: C.red, time: "9:03", text: "checkout-api p95 latency 812 ms" },
    { who: "Priya Shah", color: C.blue, time: "9:04", text: "Looking. Anyone deploy in the last hour?", reactions: [{ icon: "search", count: 2 }, "+1 3"] },
    { who: "Deploy bot", app: true, color: C.ink, time: "9:05", text: "Roll checkout-api back to v2.3.1?",
      buttons: [{ label: "Approve", style: "primary", press: sp(f, fps, 96, 8) - sp(f, fps, 104, 8) }, { label: "Reject", style: "danger" }],
      result: "Approved by Priya Shah", resolve: sp(f, fps, 110, 14) },
  ];
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Headline title="ChatWindow" enter={sp(f, fps, 0, 20)} />
      <ChatWindow r={{ x: 260, y: 230, w: 1400, h: 700 }} scale={1.2} channel="checkout-alerts" sidebar={["general", "checkout-alerts", "deploys"]}
        messages={msgs} enter={msgs.map((_, i) => sp(f, fps, 12 + i * 14, 18))} focus={f > 80 ? 3 : undefined} />
      <Cursor x={1500} y={980} to="Approve" t={glide(f, 60, 94)} press={sp(f, fps, 96, 8) - sp(f, fps, 104, 8)} opacity={ramp(f, 56, 62) * (1 - ramp(f, 120, 128))} />
      <Caption enter={sp(f, fps, 70, 20)}>Slack look by default; bots ask for approval with buttons.</Caption>
    </AbsoluteFill>
  );
};

const Shell: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Headline title="Terminal" enter={sp(f, fps, 0, 20)} />
      <Terminal r={{ x: 360, y: 300, w: 1200, h: 380 }} typed={typedChars(f, fps, 12)} lines={[
        { kind: "cmd", text: "npm run render -- Video out/launch.mp4" },
        { kind: "dim", text: "Rendering Video: frames 0-984 (32.8s), 8 workers" },
        { kind: "ok", text: "Done in 29s -> out/launch.mp4" },
      ]} />
    </AbsoluteFill>
  );
};

const Shot1: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const z = glide(f, 40, 90);
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Headline title="Screenshot + BrowserWindow" enter={sp(f, fps, 0, 20)} />
      <BrowserWindow r={{ x: 360, y: 240, w: 1200, h: 720 }} url="dashboard.example.com/services/checkout-api">
        <Screenshot r={{ x: 0, y: 0, w: 1200, h: 656 }} frame={false} src="sample-screenshot.svg" imgW={1600} imgH={1000}
          focus={{ x: 320, y: 220, w: 840, h: 220 }} zoom={z} highlight={{ x: 340, y: 240, w: 380, h: 180 }} highlightOn={ramp(f, 90, 100)}
          redact={[{ x: 410, y: 176, w: 330, h: 26 }]} />
      </BrowserWindow>
    </AbsoluteFill>
  );
};

const Icons: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ fontFamily: FONT, alignItems: "center", justifyContent: "center" }}>
      <Headline title="Icon and Chip" enter={sp(f, fps, 0, 20)} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 160px)", gap: 22, marginTop: 120 }}>
        {ICONS.map((n, i) => (
          <div key={n} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, opacity: interpolate(f, [6 + i * 2, 16 + i * 2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
            <Icon name={n} size={52} /><span style={{ fontSize: TYPE.small, color: C.dim }}>{n}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 40 }}>
        <Chip icon={<Icon name="tool" size={26} />}>get_metrics</Chip>
        <Chip icon={<Icon name="file" size={26} />} glow={1}>runbook.md</Chip>
        <Chip muted>read only</Chip>
      </div>
    </AbsoluteFill>
  );
};

// Lift + handoff: a message is pulled out of the chat into its own card, and the next scene carries that
// card on. The scene after a lift draws a LiftedMessage at the same LIFT_TO rect on its first frame.
const ALERT: ChatMessage = { who: "Monitor", app: true, color: C.red, time: "9:02", text: "checkout-api error rate 4.8% (threshold 2%)" };
const LIFT_TO: Rect = { x: 1080, y: 420, w: 640, h: 150 };
const Lift: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const msgs: ChatMessage[] = [{ who: "Priya Shah", color: C.blue, time: "9:01", text: "Deploying checkout-api v2.4.0" }, ALERT];
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Headline title="Lift out of a screen" enter={sp(f, fps, 0, 20)} />
      <ChatWindow r={{ x: 200, y: 300, w: 820, h: 420 }} channel="checkout-alerts" messages={msgs}
        lift={{ index: 1, to: LIFT_TO, t: glide(f, 40, 80) }} />
    </AbsoluteFill>
  );
};
const LiftNext: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const r = lerpRect(LIFT_TO, { x: 200, y: 300, w: 760, h: 150 }, glide(f, 0, 40));
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <LiftedMessage r={r} m={ALERT} />
      <Card style={{ position: "absolute", left: 1040, top: 300, width: 680, padding: 32, fontSize: 28, opacity: sp(f, fps, 24, 18) }}>Next scene: the card carried over, and the story continues from it.</Card>
      <Caption enter={sp(f, fps, 34, 20)}>ChatWindow lift + LiftedMessage at the same rect = one continuous object.</Caption>
    </AbsoluteFill>
  );
};

// A live channel filling up (follow), then the window dims while the one message that matters lifts out.
const FLOOD: ChatMessage[] = Array.from({ length: 9 }, (_, i) => ({
  who: "Monitor", app: true, color: i % 3 === 1 ? C.amber : C.red, time: `2:${String(10 + i).padStart(2, "0")}`,
  text: ["checkout-api error rate 4.8%", "cart-svc latency p95 1.2 s", "payments 5xx above threshold"][i % 3],
}));
const Flood: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Headline title="A channel filling up" enter={sp(f, fps, 0, 20)} />
      <ChatWindow r={{ x: 160, y: 250, w: 1100, h: 700 }} scale={1.2} channel="alerts" sidebar={["general", "alerts"]} messages={FLOOD} follow
        enter={FLOOD.map((_, i) => sp(f, fps, 10 + i * 9, 18))} dim={ramp(f, 110, 130)} lift={{ index: 7, to: { x: 1300, y: 460, w: 520, h: 140 }, t: glide(f, 110, 150) }} />
    </AbsoluteFill>
  );
};

// Many become one: the sources stay, arrows draw one after another, the result lands with the last arrow.
const SOURCES = column(3, { x: 140, y: 280, w: 620, h: 560 }, 28);
const ISSUE: Rect = { x: 1080, y: 400, w: 700, h: 320 };
const Fan: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const draw = SOURCES.map((_, i) => ramp(f, 30 + i * 10, 52 + i * 10));
  const land = sp(f, fps, 68, 18);
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Headline title="Three alerts. One ticket." enter={sp(f, fps, 0, 20)} />
      {SOURCES.map((r, i) => <LiftedMessage key={i} r={r} m={FLOOD[i]} scale={1.15} />)}
      <FanIn from={SOURCES} to={ISSUE} draw={draw} />
      <div style={{ opacity: land, transform: `translateX(${(1 - land) * 30}px)` }}>
        <TicketCard r={ISSUE} id="OPS-1042" title="Checkout degraded after v2.4.0 deploy" status="Investigating" tone="warn"
          fields={[{ label: "Signals", value: "3 alerts" }, { label: "Service", value: "checkout-api" }]} footer="Linked to 3 alerts" />
      </div>
      <div style={{ position: "absolute", left: ISSUE.x + 40, top: ISSUE.y + ISSUE.h + 30 }}>
        <StatusChip tone="good" icon="check" enter={sp(f, fps, 100, 14)}>Retest #4354 passed</StatusChip>
      </div>
    </AbsoluteFill>
  );
};

export const galleryShots: Shot[] = [
  { id: "flood", component: Flood, len: 170 },
  { id: "fan-in", component: Fan, len: 140 },
  { id: "lift", component: Lift, len: 120 },
  { id: "lift-next", component: LiftNext, len: 130, enter: "handoff" },
  { id: "chat", component: Chat, len: 160 },
  { id: "terminal", component: Shell, len: 130 },
  { id: "screenshot", component: Shot1, len: 150 },
  { id: "icons", component: Icons, len: 120 },
];
