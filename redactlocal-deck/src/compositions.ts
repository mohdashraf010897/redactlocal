import { CompositionDef } from "./engine";
import { Shot, filmCompositions } from "./kit/film";
import { TITLE_LEN, Title } from "./scenes/Title";
import { TRAP_LEN, Trap } from "./scenes/Trap";
import { ENGINE_LEN, Engine } from "./scenes/Engine";
import { ORACLES_LEN, Oracles } from "./scenes/Oracles";
import { END_LEN, End } from "./scenes/End";

// Your film, in order. Scenes live in src/scenes/ and read their words from src/story.ts.
export const shots: Shot[] = [
  { id: "title", component: Title, len: TITLE_LEN, enter: "cut" },
  { id: "trap", component: Trap, len: TRAP_LEN, enter: "dip" },
  { id: "engine", component: Engine, len: ENGINE_LEN, enter: "dip" },
  { id: "oracles", component: Oracles, len: ORACLES_LEN, enter: "dip" },
  { id: "end", component: End, len: END_LEN, enter: "dip" },
];

// "Video" is the full film; "Video-<shot>" renders one scene on its own.
export const compositions: CompositionDef[] = [
  ...filmCompositions("Video", shots),
];
