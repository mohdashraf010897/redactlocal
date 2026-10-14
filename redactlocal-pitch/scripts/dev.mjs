// Live preview: rebuilds on save and reloads the browser.  npm run dev [-- --port 3000]
import * as esbuild from "esbuild";
import path from "node:path";
import { spawn } from "node:child_process";
import { ROOT, esbuildOptions, parseArgs, prepareDir } from "./lib.mjs";

const { opt } = parseArgs(process.argv.slice(2));
const dir = path.join(ROOT, ".deck", "dev");
prepareDir(dir, true);
const ctx = await esbuild.context(esbuildOptions(dir, true));
await ctx.watch();
const { port } = await ctx.serve({ servedir: dir, host: "127.0.0.1", port: Number(opt.port ?? 3000) });
const url = `http://127.0.0.1:${port}/`;
console.log(`Preview: ${url}  (Ctrl+C to stop; restart after adding files to public/ on Windows)`);
if (!opt["no-open"]) {
  const cmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "explorer" : "xdg-open";
  spawn(cmd, [url], { stdio: "ignore", detached: true }).on("error", () => {}).unref();
}
