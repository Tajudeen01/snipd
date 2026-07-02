export const tones = [
  {
    value: "default",
    label: "Default",
    description: "Clear, concise, and useful for work or study.",
  },
  {
    value: "playful",
    label: "Playful",
    description: "Bright and lively without losing the point.",
  },
  {
    value: "quirky",
    label: "Quirky",
    description: "Unexpected phrasing with a tidy summary underneath.",
  },
  {
    value: "five_year_old",
    label: "5-Year-Old",
    description: "Simple words, short sentences, and gentle explanations.",
  },
  {
    value: "sarcastic",
    label: "Sarcastic",
    description: "Dry, witty, and still accurate to the source.",
  },
] as const;

export type Tone = (typeof tones)[number]["value"];

export const toneValues = tones.map((tone) => tone.value) as [Tone, ...Tone[]];

export function isTone(value: unknown): value is Tone {
  return typeof value === "string" && toneValues.includes(value as Tone);
}

export function getToneLabel(value: Tone) {
  return tones.find((tone) => tone.value === value)?.label ?? "Default";
}
