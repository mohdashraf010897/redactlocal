// Anonymous render count, so the author can tell how many people use motion-deck and how many
// videos they make. One small JSON event per full render; never the video, prompt, text or file names.
// The send runs in a detached process, so it never slows or fails a render. Off with
// MOTION_DECK_TELEMETRY=0 (or DO_NOT_TRACK=1).
import { execFileSync, spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const STATS_URL = process.env.MOTION_DECK_STATS_URL
  ?? "https://ajo-agents-ingester.corp.ethos509-stage-or2.stage.ethos.corp.adobe.com/runner/events";
const CACHE = process.env.MOTION_DECK_CACHE ?? path.join(os.homedir(), ".cache", "motion-deck");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hash = (s) => crypto.createHash("sha256").update(s).digest("hex").slice(0, 16);

export const usageEnabled = () =>
  !["0", "false", "off", "no"].includes(String(process.env.MOTION_DECK_TELEMETRY ?? "").toLowerCase())
  && !["1", "true"].includes(String(process.env.DO_NOT_TRACK ?? "").toLowerCase());

// Called by render.mjs after a full render is written. Returns immediately.
export function reportRender({ durationS, narrated, renderMs }) {
  try {
    if (!usageEnabled()) return;
    const notice = path.join(CACHE, "usage-notice-shown");
    if (!fs.existsSync(notice)) {
      console.log("motion-deck sends an anonymous render count (no video, text or file names). Turn it off with MOTION_DECK_TELEMETRY=0.");
      fs.mkdirSync(CACHE, { recursive: true });
      fs.writeFileSync(notice, "");
    }
    let version = "unknown";
    try { version = fs.readFileSync(path.join(ROOT, ".motion-deck-version"), "utf8").trim() || version; } catch {}
    const event = {
      type: "video_rendered", tool: "motion-deck", tool_version: version,
      project: hash(fs.realpathSync(ROOT)), duration_s: Math.round(durationS * 10) / 10,
      narrated: Boolean(narrated), render_ms: Math.round(renderMs), ts: new Date().toISOString(),
    };
    spawn(process.execPath, [fileURLToPath(import.meta.url), JSON.stringify(event)], { detached: true, stdio: "ignore" }).unref();
  } catch {}
}

// A stable anonymous id: a hash of the GitHub login (or the OS user if gh is unavailable), cached.
function userId() {
  const file = path.join(CACHE, "usage-id");
  try { const id = fs.readFileSync(file, "utf8").trim(); if (/^[0-9a-f]{16}$/.test(id)) return id; } catch {}
  let who;
  try { who = execFileSync("gh", ["api", "user", "--jq", ".login"], { timeout: 5000, stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch {}
  const id = hash(`motion-deck:${(who || os.userInfo().username).toLowerCase()}`);
  fs.mkdirSync(CACHE, { recursive: true });
  fs.writeFileSync(file, id);
  return id;
}

if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv[2]) {
  try {
    const body = JSON.stringify({ ...JSON.parse(process.argv[2]), user: userId() });
    await fetch(STATS_URL, { method: "POST", headers: { "content-type": "application/json" }, body, signal: AbortSignal.timeout(5000) });
  } catch {}
}
