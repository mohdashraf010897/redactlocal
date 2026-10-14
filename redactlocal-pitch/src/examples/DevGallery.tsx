import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "../engine";
import { Shot } from "../kit/film";
import { FONT } from "../kit/theme";
import { Caption, Headline, glide, ramp, sp } from "../kit/ui";
import { CodeBlock, CodeMorph, DiffBlock, parseDiff } from "../kit/code";
import { ArchitectureDiagram, Edge, Node, SequenceDiagram, arrange } from "../kit/diagrams";
import { PRView, TerminalReplay, tape } from "../kit/devtools";
import { typedChars } from "../kit/screens";

// A tour of the engineering components (code, diffs, diagrams, pull requests, terminal replays).
// Not part of the film; copy patterns from here. All code and names below are made up.

const RETRY = `export async function fetchOrder(id: string) {
  const res = await http.get(\`/orders/\${id}\`);
  if (res.status === 429) {
    await sleep(1000); // rate limited: try once more
    return fetchOrder(id);
  }
  return res.json() as Promise<Order>;
}`;

const Code: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Headline title="CodeBlock" enter={sp(f, fps, 0, 20)} />
      <CodeBlock r={{ x: 210, y: 250, w: 1500, h: 560 }} title="src/orders.ts" code={RETRY} typed={typedChars(f, fps, 10, 90)}
        focus={f < 140 ? [3, 4, 5] : [5]} focusT={ramp(f, 110, 126)} />
      <Caption enter={sp(f, fps, 120, 20)} strong>Unbounded retry: line 5 calls itself forever.</Caption>
    </AbsoluteFill>
  );
};

const PATCH = `diff --git a/src/orders.ts b/src/orders.ts
@@ -1,8 +1,9 @@
-export async function fetchOrder(id: string) {
+export async function fetchOrder(id: string, tries = 3) {
   const res = await http.get(\`/orders/\${id}\`);
-  if (res.status === 429) {
-    await sleep(1000); // rate limited: try once more
-    return fetchOrder(id);
+  if (res.status === 429 && tries > 1) {
+    await sleep(backoff(tries));
+    return fetchOrder(id, tries - 1);
   }
   return res.json() as Promise<Order>;
 }`;
const [FILE] = parseDiff(PATCH);

const Diff: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Headline title="DiffBlock" enter={sp(f, fps, 0, 20)} />
      <DiffBlock r={{ x: 160, y: 240, w: 1600, h: 620 }} title={FILE.file} lines={FILE.lines} t={glide(f, 20, 110)} keepRemoved />
      <Caption enter={sp(f, fps, 100, 20)}>Parsed from real `git diff` output with parseDiff.</Caption>
    </AbsoluteFill>
  );
};

const BEFORE = `function total(items) {
  let sum = 0;
  for (const i of items) {
    sum += i.price * i.qty;
  }
  return sum;
}`;
const AFTER = `function total(items) {
  return items.reduce((sum, i) => sum + i.price * i.qty, 0);
}`;
const Morph: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Headline title="CodeMorph" enter={sp(f, fps, 0, 20)} />
      <CodeMorph r={{ x: 260, y: 280, w: 1400, h: 420 }} title="cart.js" lang="js" from={BEFORE} to={AFTER} t={glide(f, 30, 100)} />
      <Caption enter={sp(f, fps, 90, 20)}>Kept lines slide; changed lines fade out and in.</Caption>
    </AbsoluteFill>
  );
};

const POS = arrange([["web"], ["api"], ["orders", "payments"], ["db", "queue"]], { x: 120, y: 260, w: 1680, h: 640 });
const NODES: Node[] = [
  { id: "web", label: "Web app", sub: "Next.js", icon: "globe", r: POS.web, kind: "external" },
  { id: "api", label: "API gateway", sub: "api/", icon: "shield", r: POS.api },
  { id: "orders", label: "Orders", sub: "services/orders", icon: "package", r: POS.orders },
  { id: "payments", label: "Payments", sub: "services/pay", icon: "bolt", r: POS.payments },
  { id: "db", label: "Postgres", sub: "orders, users", icon: "folder", r: POS.db, kind: "store" },
  { id: "queue", label: "Queue", sub: "order.created", icon: "clock", r: POS.queue, kind: "store" },
];
const EDGES: Edge[] = [
  { from: "web", to: "api", label: "HTTPS" }, { from: "api", to: "orders" }, { from: "api", to: "payments" },
  { from: "orders", to: "db", label: "SQL" }, { from: "orders", to: "queue", dashed: true },
];
const Arch: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const enter = Object.fromEntries(NODES.map((n, i) => [n.id, sp(f, fps, 8 + i * 6, 18)]));
  const draw = EDGES.map((_, i) => glide(f, 40 + i * 6, 60 + i * 6));
  const hop = (e: number, a: number) => ({ edge: e, t: ramp(f, a, a + 16) });
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Headline title="ArchitectureDiagram" enter={sp(f, fps, 0, 20)} />
      <ArchitectureDiagram nodes={NODES} edges={EDGES} enter={enter} draw={draw} pulses={[hop(0, 100), hop(1, 116), hop(3, 132)]}
        focus={f > 100 ? ["web", "api", "orders", "db"] : []} focusT={ramp(f, 100, 112)} />
    </AbsoluteFill>
  );
};

const Seq: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Headline title="SequenceDiagram" enter={sp(f, fps, 0, 20)} />
      <SequenceDiagram r={{ x: 160, y: 240, w: 1600, h: 740 }} enter={ramp(f, 4, 16)} step={glide(f, 20, 150) * 5}
        participants={[{ id: "c", label: "Client", icon: "laptop" }, { id: "a", label: "API", icon: "shield" }, { id: "o", label: "Orders", icon: "package" }, { id: "d", label: "Postgres", icon: "folder" }]}
        messages={[
          { from: "c", to: "a", label: "POST /orders" }, { from: "a", to: "o", label: "create(order)" }, { from: "o", to: "d", label: "INSERT orders" },
          { from: "o", to: "a", label: "201 Created", reply: true }, { from: "a", to: "c", label: "{ id: 4821 }", reply: true },
        ]} />
    </AbsoluteFill>
  );
};

const PRScene: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Headline title="PRView" enter={sp(f, fps, 0, 20)} />
      <PRView r={{ x: 160, y: 230, w: 1600, h: 780 }} frame={f}
        pr={{ number: 482, title: "Cap retries on rate-limited order fetches", author: "dev", branch: "fix/order-retry", additions: 4, deletions: 3, files: 1 }}
        checks={[{ name: "build", result: "pass", t: ramp(f, 20, 50) }, { name: "unit tests", result: "pass", t: ramp(f, 20, 80) }]}
        approvedBy="Priya" approved={sp(f, fps, 90, 18)} merged={ramp(f, 120, 132)}>
        <DiffBlock r={{ x: 24, y: 20, w: 1552, h: 300 }} lines={FILE.lines.slice(4, 11)} t={1} />
      </PRView>
    </AbsoluteFill>
  );
};

const TESTS = tape([
  { cmd: "npm test -- orders" }, { wait: 0.5 },
  { out: ["> vitest run orders", "", " ✓ fetchOrder returns the order (12 ms)", " ✓ retries on 429 up to 3 times (5 ms)", " ✓ gives up after 3 tries (3 ms)"], gap: 0.25 },
  { wait: 0.3 }, { out: ["", " Tests  3 passed (3)", " Duration  412 ms"] },
], "orders");
const Replay: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Headline title="TerminalReplay" enter={sp(f, fps, 0, 20)} />
      <TerminalReplay r={{ x: 260, y: 250, w: 1400, h: 600 }} tape={TESTS} frame={f} fps={fps} start={12} fontSize={30} />
      <Caption enter={sp(f, fps, 110, 20)}>Scripted with tape(), or recorded for real with npm run capture.</Caption>
    </AbsoluteFill>
  );
};

export const devGalleryShots: Shot[] = [
  { id: "code", component: Code, len: 200 },
  { id: "diff", component: Diff, len: 160 },
  { id: "morph", component: Morph, len: 140 },
  { id: "arch", component: Arch, len: 170 },
  { id: "sequence", component: Seq, len: 180 },
  { id: "pr", component: PRScene, len: 160 },
  { id: "replay", component: Replay, len: 150 },
];
