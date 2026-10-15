# Video project

Made with the `motion-deck` skill. Scenes are React components. Every frame is rendered
in your installed Chrome or Edge (headless) and encoded to H.264 MP4 by the browser's built-in encoder.

## Commands

```bash
npm run dev                                    # live preview with scrubber (esbuild, reloads on save)
npm run still -- --list                        # compositions and lengths
npm run still -- Video 0 2s 90 end --sheet     # PNG stills plus a contact sheet in out/stills/<time>/
npm run still -- Video --cuts --sheet          # frames around every scene change
npm run still -- Video --shots --sheet         # one settled frame per scene
npm run frames -- old.mp4 --every 2 --sheet    # frames from a reference video, in out/frames/<time>/
npm run render -- Video out/video.mp4          # full MP4
npm run render -- Video out/clip.mp4 --from 300 --to 420   # a short clip
npm run voice                                  # narration: speak every `say` line, check it fits each shot
npm run voice -- --say "Try a sentence"        # one sentence to out/say.wav
npm run render -- Video --captions             # burn captions from the narration, and write out/Video.srt
npm run capture -- tests "npm test"            # record a real command's output to src/tapes/tests.ts
npm run shoot -- home http://localhost:5173    # screenshot your app into public/shots/home/ + src/shots/home.ts
npm run typecheck
```

## Files

| Path | What |
|---|---|
| `src/story.ts` | All on-screen words and numbers for your film. Replace the starter first. |
| `src/compositions.ts` | Your film's `shots`: order, lengths and transitions. Until it has shots, `Video` plays the example. |
| `src/scenes/*.tsx` | Your scenes, one file each. Starts empty. |
| `src/examples/` | A finished example film (`Example`) and component tours (`Gallery`, and `DevGallery` for code, diagrams, PRs and terminals). Self-contained; copy patterns from it, delete it when done (and its lines in `compositions.ts`). |
| `src/kit/theme.ts` | Colours, fonts and type scale. |
| `src/kit/ui.tsx` | Building blocks: Headline, Caption, Card, Chip, Arrow, Bars, Cursor, helpers. |
| `src/kit/film.tsx` | Timeline and transitions (dip, handoff, cut). |
| `src/kit/flow.tsx` | Many-to-one and results: `column`, `FanIn` (arrows), `TicketCard`, `StatusChip`. |
| `src/kit/icons.tsx` | Line icons (`Icon`, `Status`). Use these instead of emoji. |
| `src/kit/code.tsx` | `CodeBlock` (highlighted, typed, focus lines), `DiffBlock` with `parseDiff`, `CodeMorph`. |
| `src/kit/diagrams.tsx` | `ArchitectureDiagram` (boxes, arrows, request pulses), `SequenceDiagram`, `arrange`. |
| `src/kit/devtools.tsx` | `PRView`, `TerminalReplay` and `tape()`. |
| `src/shots/`, `public/shots/` | Screenshots of a real UI from `npm run shoot`, with element positions. Look at them before sharing. |
| `src/tapes/` | Terminal sessions recorded with `npm run capture`. Read them for secrets before use. |
| `src/kit/screens.tsx` | Recreated app screens: `ChatWindow` (Slack look by default), `BrowserWindow`, `Terminal`, `Screenshot`. |
| `src/engine/` | Frame engine, preview player and render hooks. You rarely need to touch this. |
| `scripts/` | esbuild preview server, still, frame-grab and MP4 renderers, and the MP4 writer. |
| `scripts/voice/` | Local narration: Kokoro-82M on onnxruntime-web, and an English pronunciation port of misaki. |
| `pronounce.json` | How to say names the narrator gets wrong. Starts empty. |
| `public/` | Fonts, logos and images. Load them with `staticFile("...")`. |

## Rules

Animate only from `useCurrentFrame()`. CSS transitions, timers and unseeded randomness will not render correctly.
