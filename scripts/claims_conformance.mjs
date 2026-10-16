#!/usr/bin/env node
// Claims-conformance: fail CI when a banned/unsupported claim appears in shipped or marketing surfaces.
// Usage: node scripts/claims_conformance.mjs [--mode=raster|true]   (default raster)
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const mode = (process.argv.find(a => a.startsWith('--mode=')) || '--mode=raster').split('=')[1];
const ROOT = execSync('git rev-parse --show-toplevel').toString().trim();
const files = execSync('git ls-files', { cwd: ROOT, maxBuffer: 1 << 28 }).toString().split('\n')
  .filter(f => /\.(html|md|json|js|mjs|rs|toml|yml|yaml|txt|swift|py|sh|ps1)$/.test(f))
  .filter(f => !/^(redaction-test-lab|core\/engine|node_modules|vendor)\//.test(f))
  .filter(f => !/^(CHANGELOG\.md|RELEASE_NOTES\.md|package-lock\.json)$/.test(f));

// Claims that are false under the raster-flatten pipeline (banned in shipped surfaces)
const rasterBanned = [
  [/mupdf(\.js)?\s*(wasm|webassembly|engine)|powered by mupdf|MUPDF EXCISED/i, 'engine claim: mupdf is not wired into the shipped pipeline'],
  [/10-step surgical pipeline/i, 'unimplemented pipeline description'],
  [/7[- ]oracle clean room|dual-engine verification by PDF\.js & pypdf/i, 'oracle claim: requires real, executed oracles'],
  [/ed25519:sig:/i, 'fabricated ed25519 signature string']
];

const rules = rasterBanned;
let hits = 0;
const byRule = {};

for (const f of files) {
  if (/^(dist|build)\//.test(f)) continue; // generated copies are checked by the sync step below
  const lines = fs.readFileSync(`${ROOT}/${f}`, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const [re, why] of rules) {
      if (re.test(line)) {
        hits++;
        byRule[why] = (byRule[why] || 0) + 1;
        if (process.env.VERBOSE) console.log(`${f}:${i + 1}: ${why}`);
      }
    }
  });
}

// Output-capability claims must match the code: raster path must not contain fake PASS/timer oracles
const app = fs.readFileSync(`${ROOT}/redactlocal-app.html`, 'utf8');
const hardcodedPass = (app.match(/result:\s*"PASS"/g) || []).length;
if (hardcodedPass) { hits += hardcodedPass; byRule['hard-coded oracle PASS literals'] = hardcodedPass; }
const simulated = /setTimeout\(\(\) => \{\s*const b = document\.getElementById\(`badge-o\$\{i\}`\)/.test(app);
if (simulated) { hits++; byRule['oracle badges flipped by timer, not by verification'] = 1; }

// dist/studio.html must be byte-identical to redactlocal-app.html
if (fs.existsSync(`${ROOT}/dist/studio.html`)) {
  const distStudio = fs.readFileSync(`${ROOT}/dist/studio.html`, 'utf8');
  if (distStudio !== app) {
    hits++;
    byRule['stale copy dist/studio.html'] = 1;
  }
}

console.log(JSON.stringify({ mode, scanned: files.length, violations: hits, byRule }, null, 1));
process.exit(hits ? 1 : 0);
