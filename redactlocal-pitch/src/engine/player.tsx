import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { CaptionCue, CaptionsProvider, CompositionDef, FrameProvider } from "./core";

declare global {
  interface Window {
    __deck?: {
      compositions: Omit<CompositionDef, "component">[];
      setFrame: (frame: number) => Promise<void>;
      setCaptions: (cues: CaptionCue[] | null) => void;
    };
  }
}

const Stage: React.FC<{ comp: CompositionDef; frame: number; captions?: CaptionCue[] | null }> = ({ comp, frame, captions = null }) => {
  const C = comp.component;
  return (
    <div style={{ position: "relative", width: comp.width, height: comp.height, overflow: "hidden", background: "#000" }}>
      <CaptionsProvider value={captions}>
        <FrameProvider frame={frame} config={comp}>
          <C />
        </FrameProvider>
      </CaptionsProvider>
    </div>
  );
};

const settle = async () => {
  await document.fonts.ready;
  await Promise.all(Array.from(document.images).map((i) => (i.complete ? null : i.decode().catch(() => null))));
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
};

// Headless mode used by the renderer: native size, frame driven from outside.
function mountRender(el: HTMLElement, comps: CompositionDef[], id: string) {
  const comp = comps.find((c) => c.id === id);
  if (!comp) throw new Error(`Unknown composition "${id}". Known: ${comps.map((c) => c.id).join(", ")}`);
  document.body.style.margin = "0";
  const root = createRoot(el);
  let captions: CaptionCue[] | null = null, last = 0;
  const draw = (f: number) => { last = f; flushSync(() => root.render(<Stage comp={comp} frame={f} captions={captions} />)); };
  draw(0);
  window.__deck = {
    compositions: comps.map(({ component: _c, ...rest }) => rest),
    setFrame: async (f) => { draw(f); await settle(); },
    setCaptions: (cues) => { captions = cues; draw(last); },
  };
}

const Preview: React.FC<{ comps: CompositionDef[] }> = ({ comps }) => {
  const params = new URLSearchParams(location.search);
  const [id, setId] = useState(params.get("comp") ?? comps[0]?.id);
  const comp = comps.find((c) => c.id === id) ?? comps[0];
  const [frame, setFrame] = useState(Number(params.get("frame") ?? 0));
  const [playing, setPlaying] = useState(false);
  const [box, setBox] = useState({ w: innerWidth, h: innerHeight });
  const start = useRef(0);

  useEffect(() => {
    const onResize = () => setBox({ w: innerWidth, h: innerHeight });
    addEventListener("resize", onResize);
    return () => removeEventListener("resize", onResize);
  }, []);
  useEffect(() => {
    if (!playing) return;
    start.current = performance.now() - (frame / comp.fps) * 1000;
    let raf = 0;
    const tick = () => {
      const f = Math.floor(((performance.now() - start.current) / 1000) * comp.fps);
      if (f >= comp.durationInFrames) { setFrame(comp.durationInFrames - 1); setPlaying(false); return; }
      setFrame(f);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, comp]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") { e.preventDefault(); setPlaying((p) => !p); }
      if (e.code === "ArrowRight") setFrame((f) => Math.min(comp.durationInFrames - 1, f + (e.shiftKey ? 30 : 1)));
      if (e.code === "ArrowLeft") setFrame((f) => Math.max(0, f - (e.shiftKey ? 30 : 1)));
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [comp]);

  const scale = Math.min((box.w - 40) / comp.width, (box.h - 120) / comp.height);
  const ui: React.CSSProperties = { font: "13px system-ui", color: "#ddd" };
  return (
    <div style={{ position: "fixed", inset: 0, background: "#1b1b1b", display: "flex", flexDirection: "column", alignItems: "center", ...ui }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", padding: 10 }}>
        <select value={comp.id} onChange={(e) => { setId(e.target.value); setFrame(0); setPlaying(false); }}>
          {comps.map((c) => <option key={c.id} value={c.id}>{c.id}</option>)}
        </select>
        <button onClick={() => setPlaying((p) => !p)}>{playing ? "Pause" : "Play"}</button>
        <span>frame {frame} / {comp.durationInFrames - 1} · {(frame / comp.fps).toFixed(2)}s</span>
        <span style={{ color: "#888" }}>space play · ←/→ step · shift = 1s</span>
      </div>
      <div style={{ width: comp.width * scale, height: comp.height * scale }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}><Stage comp={comp} frame={frame} /></div>
      </div>
      <input type="range" min={0} max={comp.durationInFrames - 1} value={frame} onChange={(e) => { setPlaying(false); setFrame(Number(e.target.value)); }} style={{ width: comp.width * scale, marginTop: 10 }} />
    </div>
  );
};

export function mount(comps: CompositionDef[]) {
  const el = document.getElementById("root")!;
  const params = new URLSearchParams(location.search);
  if (params.get("render")) mountRender(el, comps, params.get("comp") ?? comps[0].id);
  else createRoot(el).render(<Preview comps={comps} />);
}
