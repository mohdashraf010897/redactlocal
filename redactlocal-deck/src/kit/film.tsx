import React, { createContext, useContext } from "react";
import { AbsoluteFill, CompositionDef, Sequence, interpolate, useCaptions, useCurrentFrame } from "../engine";
import { C, FONT } from "./theme";

// Transition lengths in frames (30 fps). Slow enough to follow, fast enough not to drag.
export const DIP = 22; // fade through the background colour
export const HAND = 30; // overlap where the next scene morphs in over the previous one
export const OUT = 18; // outgoing scene fades faster than the incoming morph, so nothing ghosts
export const READ = 120; // hold after the last text lands: ~4 s of reading time

export type Enter = "cut" | "dip" | "handoff";
// One scene in the film. `len` is the scene's own length; transitions are added around it.
// `say` is the narration spoken over this shot, starting `sayAt` frames in (default 10).
export type Shot = { id: string; component: React.FC; len: number; enter?: Enter; say?: string; sayAt?: number };
// Narration voice for a film. See `npm run voice -- --voices`.
export type Narration = { voice?: string; speed?: number };

type Placed = Shot & { start: number; content: number; seqLen: number; exitAt: number | null };

export function place(shots: Shot[]): { placed: Placed[]; length: number } {
  const placed: Placed[] = [];
  let end = 0;
  shots.forEach((s, i) => {
    const enter = i === 0 ? "cut" : s.enter ?? "dip";
    const start = enter === "dip" ? Math.max(0, end - DIP) : enter === "handoff" ? end - HAND : end;
    const content = enter === "dip" && i > 0 ? start + DIP : start;
    placed.push({ ...s, enter, start, content, seqLen: content - start + s.len, exitAt: null });
    end = content + s.len;
  });
  placed.forEach((p, i) => {
    const next = placed[i + 1];
    if (next?.enter === "handoff") p.exitAt = p.len - HAND; // relative to the shot's content start
  });
  return { placed, length: end };
}

const ExitCtx = createContext({ exit: 0, handing: false });
// 0 -> 1 while this scene hands off to the next one. Use it for custom exit motion.
export const useExit = () => useContext(ExitCtx).exit;
// True from the first frame the next shot is drawn on top. Hide shared elements the next shot redraws.
export const useHandingOff = () => useContext(ExitCtx).handing;

const Dip: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const bg = interpolate(f, [0, DIP], [0, 1], cl);
  const o = interpolate(f, [DIP, DIP + 16], [0, 1], cl);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: C.bg, opacity: bg }} />
      <Sequence from={DIP} layout="none">
        <AbsoluteFill style={{ opacity: o, filter: o < 1 ? `blur(${(1 - o) * 6}px)` : undefined }}>{children}</AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

const WithExit: React.FC<{ exitAt: number | null; children: React.ReactNode }> = ({ exitAt, children }) => {
  const f = useCurrentFrame();
  const exit = exitAt === null ? 0 : interpolate(f, [exitAt, exitAt + OUT], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <ExitCtx.Provider value={{ exit, handing: exitAt !== null && f >= exitAt }}>
      <AbsoluteFill style={{ opacity: 1 - exit, filter: exit > 0 ? `blur(${exit * 6}px)` : undefined }}>{children}</AbsoluteFill>
    </ExitCtx.Provider>
  );
};

// Burned-in captions (render or still with --captions): one short line at a time on a dark band.
// The kit's Caption moves up to make room.
const Captions: React.FC = () => {
  const cues = useCaptions(), f = useCurrentFrame();
  const cue = cues?.find((c) => f >= c.from && f < c.to);
  if (!cue) return null;
  const o = Math.min(1, (f - cue.from + 1) / 4, (cue.to - f) / 4);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 44, display: "flex", justifyContent: "center", opacity: o }}>
      <div style={{ maxWidth: 1500, padding: "12px 28px", borderRadius: 14, background: "rgba(11,11,11,.84)", color: "#fff", fontFamily: FONT, fontSize: 44, fontWeight: 600, lineHeight: 1.25, textAlign: "center" }}>{cue.text}</div>
    </div>
  );
};

// Plays the shots back to back on the shared background, applying each shot's entry transition.
export const Film: React.FC<{ shots: Shot[] }> = ({ shots }) => {
  const { placed } = place(shots);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {placed.map((p) => {
        const Comp = p.component;
        const body = <WithExit exitAt={p.exitAt}><Comp /></WithExit>;
        return (
          <Sequence key={p.id} from={p.start} durationInFrames={p.seqLen}>
            {p.enter === "dip" && p.start !== p.content ? <Dip>{body}</Dip> : body}
          </Sequence>
        );
      })}
      <Captions />
    </AbsoluteFill>
  );
};

const base = { width: 1920, height: 1080, fps: 30 };

// The full film plus one composition per shot, so each scene can be previewed and stilled on its own.
export function filmCompositions(id: string, shots: Shot[], narration?: Narration): CompositionDef[] {
  const FilmComp: React.FC = () => <Film shots={shots} />;
  const { placed, length } = place(shots);
  const meta = placed.map((p) => ({ id: p.id, start: p.content, len: p.len, say: p.say, sayAt: p.sayAt }));
  return [
    { id, component: FilmComp, durationInFrames: length, shots: meta, narration, ...base },
    ...shots.map((s) => {
      const Solo: React.FC = () => <AbsoluteFill style={{ background: C.bg }}><s.component /></AbsoluteFill>;
      return { id: `${id}-${s.id}`, component: Solo, durationInFrames: s.len, ...base };
    }),
  ];
}

// Frame in the full film where a shot's own frame 0 lands. Handy for stills of transitions.
export const shotStart = (shots: Shot[], id: string) => place(shots).placed.find((p) => p.id === id)?.content ?? 0;
