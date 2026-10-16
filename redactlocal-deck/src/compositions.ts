import { CompositionDef } from "./engine";
import { Shot, filmCompositions } from "./kit/film";
import { TITLE_LEN, Title } from "./scenes/Title";
import { BATCH_LEN, BatchScene } from "./scenes/BatchScene";
import { SINGLE_LEN, SingleScene } from "./scenes/SingleScene";
import { END_LEN, End } from "./scenes/End";

// Your film, in order: Drop -> Batch Queue -> Single Document Deep Inspection -> Proof & CTA
export const shots: Shot[] = [
  { id: "title", component: Title, len: TITLE_LEN, enter: "cut" },
  { id: "batch", component: BatchScene, len: BATCH_LEN, enter: "dip" },
  { id: "single", component: SingleScene, len: SINGLE_LEN, enter: "dip" },
  { id: "end", component: End, len: END_LEN, enter: "dip" },
];

// "Video" is the full film; "Video-<shot>" renders one scene on its own.
export const compositions: CompositionDef[] = [
  ...filmCompositions("Video", shots),
];
