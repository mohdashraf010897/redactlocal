// Records a real command's output, with timing, as a tape for TerminalReplay (src/kit/devtools.tsx).
//   npm run capture -- <name> "<command>" [--cwd ../repo] [--redact "regex"]... [--shown "cmd as displayed"]
// Writes src/tapes/<name>.ts. Colours are stripped. Secrets that look like tokens or keys, your home folder and
// your user name are masked; add --redact for anything else (hostnames, customer names). Read the file before
// you use it: the video will be shared.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ROOT } from "./lib.mjs";

const argv = process.argv.slice(2);
const pos = [], redact = [];
let cwd = process.cwd(), shown;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--cwd") cwd = path.resolve(argv[++i]);
  else if (argv[i] === "--redact") redact.push(new RegExp(argv[++i], "g"));
  else if (argv[i] === "--shown") shown = argv[++i];
  else pos.push(argv[i]);
}
const [name, command] = pos;
if (!name || !command || !/^[A-Za-z][\w-]*$/.test(name)) {
  console.error('Usage: npm run capture -- <name> "<command>" [--cwd dir] [--redact "regex"] [--shown "displayed command"]');
  process.exit(2);
}

const SECRETS = [
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g, /\bgithub_pat_\w{20,}\b/g, /\bxox[abprs]-[\w-]{10,}\b/g, /\bAKIA[0-9A-Z]{16}\b/g,
  /\beyJ[\w-]{8,}\.[\w-]{8,}\.[\w-]{8,}\b/g, /\b(sk|pk|rk)-[A-Za-z0-9_-]{20,}\b/g, /\bBearer\s+[\w.~+/-]{12,}=*/gi,
  /\b((?:api[_-]?key|token|secret|passw(?:or)?d|pwd|auth)\w*\s*[:=]\s*)["']?[^\s"']{6,}["']?/gi,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(-----END [A-Z ]*PRIVATE KEY-----|$)/g,
];
const home = os.homedir(), user = os.userInfo().username;
const clean = (s) => {
  let out = s.replace(/\x1b\[[0-9;?]*[ -/]*[@-~]|\x1b\][^\x07]*(\x07|\x1b\\)|\x1b[@-_]/g, "");
  out = out.split("\r").filter(Boolean).pop() ?? ""; // progress bars redraw with \r: keep the last state
  for (const re of SECRETS) out = out.replace(re, (m, keep) => (typeof keep === "string" && m.startsWith(keep) ? `${keep}••••••` : "••••••"));
  for (const re of redact) out = out.replace(re, "••••••");
  out = out.split(home).join("~");
  if (user.length > 2) out = out.replace(new RegExp(`\\b${user.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g"), "dev");
  return out.replace(/\t/g, "  ");
};

const t0 = process.hrtime.bigint();
const secs = () => Math.round(Number(process.hrtime.bigint() - t0) / 1e6) / 1000;
const events = [{ t: 0, cmd: clean(shown ?? command) }];
const child = spawn(command, { cwd, shell: true, env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0", CI: "1" } });
const pipe = (stream, err) => {
  let buf = "";
  stream.on("data", (d) => {
    buf += d.toString();
    const lines = buf.split("\n");
    buf = lines.pop();
    for (const l of lines) events.push({ t: secs(), out: clean(l), ...(err ? { err: true } : {}) });
  });
  stream.on("end", () => { if (buf) events.push({ t: secs(), out: clean(buf), ...(err ? { err: true } : {}) }); });
};
pipe(child.stdout, false);
pipe(child.stderr, true);
const code = await new Promise((r) => child.on("close", r));
events.sort((a, b) => a.t - b.t);

const dir = path.join(ROOT, "src", "tapes");
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, `${name}.ts`);
const body = events.map((e) => `    ${JSON.stringify(e)},`).join("\n");
fs.writeFileSync(file, `// Recorded with: npm run capture -- ${name} ${JSON.stringify(shown ?? command)}  (exit code ${code})\n` +
  `// Review before sharing: secrets, home folder and user name are masked, nothing else is.\n` +
  `import { Tape } from "../kit/devtools";\n\nexport const ${name.replace(/-(\w)/g, (_, c) => c.toUpperCase())}: Tape = {\n  title: ${JSON.stringify(path.basename(cwd))},\n  events: [\n${body}\n  ],\n};\n`);
const outLines = events.length - 1;
console.log(`${outLines} lines in ${secs().toFixed(1)}s (exit code ${code}) -> ${path.relative(ROOT, file)}`);
if (outLines > 60) console.log("Long output: keep only the lines the viewer needs (the replay scrolls, but nobody reads 60 lines).");
