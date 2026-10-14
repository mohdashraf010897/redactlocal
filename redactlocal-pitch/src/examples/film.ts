import { Shot } from "../kit/film";
import { TITLE_LEN, Title } from "./scenes/Title";
import { MANY_LEN, ManyToOne } from "./scenes/ManyToOne";
import { BREAKDOWN_LEN, Breakdown } from "./scenes/Breakdown";
import { NUMBERS_LEN, Numbers } from "./scenes/Numbers";
import { END_LEN, End } from "./scenes/End";

// A finished five-scene example film (fictional "Orbit" product). Self-contained: it reads only
// ./story.ts, so rewriting src/story.ts never breaks it. Copy patterns from here; don't edit in place.
export const exampleShots: Shot[] = [
  { id: "title", component: Title, len: TITLE_LEN },
  { id: "many", component: ManyToOne, len: MANY_LEN },
  { id: "breakdown", component: Breakdown, len: BREAKDOWN_LEN, enter: "handoff" },
  { id: "numbers", component: Numbers, len: NUMBERS_LEN },
  { id: "end", component: End, len: END_LEN },
];
