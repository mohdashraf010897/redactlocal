import { CompositionDef } from "./engine";
import { Shot, filmCompositions } from "./kit/film";
import { Title, TITLE_LEN } from "./scenes/Title";
import { Install, INSTALL_LEN } from "./scenes/Install";
import { LegalCase, LEGAL_LEN } from "./scenes/LegalCase";
import { FinanceCase, FINANCE_LEN } from "./scenes/FinanceCase";
import { MedicalCase, MEDICAL_LEN } from "./scenes/MedicalCase";
import { Closing, CLOSING_LEN } from "./scenes/Closing";

// Real Product Demo & Use Cases Film
export const shots: Shot[] = [
  { id: "title", component: Title, len: TITLE_LEN },
  { id: "install", component: Install, len: INSTALL_LEN, enter: "dip" },
  { id: "legal", component: LegalCase, len: LEGAL_LEN, enter: "handoff" },
  { id: "finance", component: FinanceCase, len: FINANCE_LEN, enter: "handoff" },
  { id: "medical", component: MedicalCase, len: MEDICAL_LEN, enter: "handoff" },
  { id: "closing", component: Closing, len: CLOSING_LEN, enter: "dip" },
];

export const compositions: CompositionDef[] = [
  ...filmCompositions("Video", shots),
];
