import React, { createContext, useContext } from "react";

export type VideoConfig = { width: number; height: number; fps: number; durationInFrames: number };

// `shots` (films only) lists where each shot's own frame 0 lands in the film, how long it runs, and
// its narration line. `narration` picks the voice. Both are read by `npm run voice` and render.
export type CompositionDef = VideoConfig & {
  id: string;
  component: React.FC;
  shots?: { id: string; start: number; len: number; say?: string; sayAt?: number }[];
  narration?: { voice?: string; speed?: number };
};

// One on-screen caption, in film frames [from, to). Made from the narration by `--captions`.
export type CaptionCue = { from: number; to: number; text: string };

const FrameCtx = createContext(0);
const CaptionsCtx = createContext<CaptionCue[] | null>(null);
// Caption cues when the film is rendered with `--captions`, else null. Film draws them; Caption makes room.
export const useCaptions = () => useContext(CaptionsCtx);
export const CaptionsProvider = CaptionsCtx.Provider;
const ConfigCtx = createContext<VideoConfig>({ width: 1920, height: 1080, fps: 30, durationInFrames: 1 });

// Frame number relative to the innermost <Sequence> (or the whole composition).
export const useCurrentFrame = () => useContext(FrameCtx);
export const useVideoConfig = () => useContext(ConfigCtx);

export const FrameProvider: React.FC<{ frame: number; config: VideoConfig; children: React.ReactNode }> = ({ frame, config, children }) => (
  <ConfigCtx.Provider value={config}>
    <FrameCtx.Provider value={frame}>{children}</FrameCtx.Provider>
  </ConfigCtx.Provider>
);

export const AbsoluteFill: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode }> = ({ style, children }) => (
  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", ...style }}>{children}</div>
);

// Shows children only during [from, from + durationInFrames) and shifts their clock so they start at 0.
export const Sequence: React.FC<{ from?: number; durationInFrames?: number; layout?: "absolute-fill" | "none"; children: React.ReactNode }> = ({
  from = 0, durationInFrames = Infinity, layout = "absolute-fill", children,
}) => {
  const frame = useCurrentFrame();
  if (frame < from || frame >= from + durationInFrames) return null;
  const inner = <FrameCtx.Provider value={frame - from}>{children}</FrameCtx.Provider>;
  return layout === "none" ? inner : <AbsoluteFill>{inner}</AbsoluteFill>;
};

// Holds children at a fixed frame (e.g. to keep a scene still while something flies over it).
export const Freeze: React.FC<{ frame: number; children: React.ReactNode }> = ({ frame, children }) => (
  <FrameCtx.Provider value={frame}>{children}</FrameCtx.Provider>
);

// Resolves a path inside public/ for the dev server and the rendered build alike.
export const staticFile = (path: string) => `public/${path.replace(/^\//, "")}`;
