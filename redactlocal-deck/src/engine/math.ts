// Pure, frame-driven animation math. Every value is a function of the frame number,
// so any frame can be rendered in isolation and in any order.

export type Extrapolate = "clamp" | "extend" | "identity";
export type EasingFn = (t: number) => number;

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

export function interpolate(
  input: number,
  inRange: readonly number[],
  outRange: readonly number[],
  opts: { extrapolateLeft?: Extrapolate; extrapolateRight?: Extrapolate; easing?: EasingFn } = {},
): number {
  if (inRange.length !== outRange.length || inRange.length < 2) throw new Error("interpolate: ranges must match and have >= 2 points");
  const { extrapolateLeft = "extend", extrapolateRight = "extend", easing = (t: number) => t } = opts;
  let i = 1;
  while (i < inRange.length - 1 && input > inRange[i]) i++;
  const a = inRange[i - 1], b = inRange[i], oa = outRange[i - 1], ob = outRange[i];
  let x = input;
  if (x < inRange[0]) {
    if (extrapolateLeft === "clamp") return outRange[0];
    if (extrapolateLeft === "identity") return x;
  }
  if (x > inRange[inRange.length - 1]) {
    if (extrapolateRight === "clamp") return outRange[outRange.length - 1];
    if (extrapolateRight === "identity") return x;
  }
  const t = b === a ? 0 : (x - a) / (b - a);
  return oa + (ob - oa) * easing(t);
}

export const Easing = {
  linear: (t: number) => t,
  in: (e: EasingFn) => e,
  out: (e: EasingFn) => (t: number) => 1 - e(1 - t),
  inOut: (e: EasingFn) => (t: number) => (t < 0.5 ? e(t * 2) / 2 : 1 - e((1 - t) * 2) / 2),
  quad: (t: number) => t * t,
  cubic: (t: number) => t * t * t,
  sin: (t: number) => 1 - Math.cos((t * Math.PI) / 2),
  exp: (t: number) => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1))),
  bezier: (x1: number, y1: number, x2: number, y2: number): EasingFn => {
    const bx = (t: number) => 3 * x1 * t * (1 - t) ** 2 + 3 * x2 * t * t * (1 - t) + t ** 3;
    const by = (t: number) => 3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t * t * (1 - t) + t ** 3;
    return (x: number) => {
      let lo = 0, hi = 1;
      for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (bx(m) < x) lo = m; else hi = m; }
      return by((lo + hi) / 2);
    };
  },
};

export type SpringConfig = { damping?: number; stiffness?: number; mass?: number; overshootClamping?: boolean };

const STEPS = 8; // physics sub-steps per frame
const simCache = new Map<string, number[]>();

// Position (0 -> 1) of a damped spring at each frame, from a fixed-step simulation.
function simulate(fps: number, c: Required<SpringConfig>): number[] {
  const key = `${fps}|${c.damping}|${c.stiffness}|${c.mass}|${c.overshootClamping}`;
  const hit = simCache.get(key);
  if (hit) return hit;
  const out = [0];
  let x = 0, v = 0, rest = 0;
  const dt = 1 / fps / STEPS;
  for (let f = 1; f < fps * 30 && rest < 3; f++) {
    for (let s = 0; s < STEPS; s++) {
      const a = (-c.stiffness * (x - 1) - c.damping * v) / c.mass;
      v += a * dt;
      x += v * dt;
    }
    if (c.overshootClamping && x > 1) { x = 1; v = 0; }
    out.push(x);
    rest = Math.abs(x - 1) < 0.0005 && Math.abs(v) < 0.005 ? rest + 1 : 0;
  }
  out[out.length - 1] = 1;
  simCache.set(key, out);
  return out;
}

const fill = (c: SpringConfig): Required<SpringConfig> => ({ damping: 10, stiffness: 100, mass: 1, overshootClamping: false, ...c });

// Frames until the spring settles. Useful for timing the next beat.
export const springDuration = (fps: number, config: SpringConfig = {}) => simulate(fps, fill(config)).length - 1;

// Spring from `from` to `to` starting at frame 0. `durationInFrames` stretches the natural motion to that length.
export function spring({ frame, fps, config = {}, from = 0, to = 1, durationInFrames }: {
  frame: number; fps: number; config?: SpringConfig; from?: number; to?: number; durationInFrames?: number;
}): number {
  if (frame <= 0) return from;
  const curve = simulate(fps, fill(config));
  const natural = curve.length - 1;
  const f = durationInFrames ? (frame * natural) / durationInFrames : frame;
  if (f >= natural) return to;
  const i = Math.floor(f), t = f - i;
  const p = curve[i] + (curve[i + 1] - curve[i]) * t;
  return from + (to - from) * p;
}
