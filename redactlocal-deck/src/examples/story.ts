// Everything a viewer reads lives here, so scenes stay reusable and variants are a data change.
// This example story is fictional placeholder content. Replace it with the brief.
import type { IconName } from "../kit/icons";

export const story = {
  product: "Orbit",
  tagline: "Status updates, without the status meeting.",
  footer: "EXAMPLE TEAM · INTERNAL",
  many: {
    kicker: "Monday, 9:00 a.m.",
    title: "Three threads. One update.",
    cards: [
      { who: "Build bot", text: "release-42 build passed on main" },
      { who: "Tracker", text: "4 tickets moved to Done this week" },
      { who: "Incidents", text: "No open incidents since Thursday" },
    ],
    target: { label: "WEEKLY UPDATE", title: "Release 42 is on track", sub: "3 sources · drafted for you" },
  },
  breakdown: {
    kicker: "Built from your sources",
    title: "Every line links back.",
    lines: [
      { icon: "tool" as IconName, text: "build: release-42 · passed" },
      { icon: "check" as IconName, text: "tickets: 4 done · 2 in review" },
      { icon: "info" as IconName, status: "good" as const, text: "incidents: none open" },
    ],
    caption: "Nothing is invented. Each line cites where it came from.",
  },
  numbers: {
    kicker: "Pilot results",
    title: "Less time writing updates.",
    unit: " min",
    bars: [
      { label: "Before", value: 45 },
      { label: "After", value: 6, highlight: true },
    ],
    caption: "Illustrative numbers for this example.",
  },
  end: { line: "Spend Monday building, not reporting.", cta: "#orbit-help" },
};
export type Story = typeof story;
