import { staticFile } from "../engine";

// Design tokens. Change these to re-skin every scene at once.
export const C = {
  bg: "#0B0F19", // sleek dark frontier canvas
  ink: "#F8FAFC",
  card: "#161E2E",
  line: "#2A364F",
  dim: "#94A3B8",
  accent: "#3B82F6", // electric blue brand
  red: "#EF4444",
  amber: "#F59E0B",
  green: "#10B981",
  blue: "#3B82F6",
};

export const FONT = "'Source Sans 3', system-ui, sans-serif";
export const MONO = "'Source Code Pro', ui-monospace, monospace";
export const SHADOW = "0 1px 2px rgba(20,18,14,.06), 0 10px 30px -8px rgba(20,18,14,.16)";
export const RADIUS = 32;

// Type scale for 1920x1080. Nothing a viewer must read goes below `small`.
export const TYPE = { hero: 162, title: 82, heading: 48, body: 32, small: 24, kicker: 34 };

export const fontFaces = `
@font-face{font-family:'Source Sans 3';src:url(${staticFile("fonts/SourceSans3-Variable.woff2")}) format('woff2');font-weight:100 900}
@font-face{font-family:'Source Code Pro';src:url(${staticFile("fonts/SourceCodePro-Variable.woff2")}) format('woff2');font-weight:100 900}
`;
