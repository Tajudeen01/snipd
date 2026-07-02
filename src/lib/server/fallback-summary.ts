import "server-only";

import type { Tone } from "@/lib/tones";
import { normalizeInput } from "@/lib/validation";

function sentenceSplit(content: string) {
  return normalizeInput(content)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function tonePrefix(tone: Tone) {
  const prefixes: Record<Tone, string> = {
    default: "",
    playful: "Quick sparkle pass: ",
    quirky: "Tiny brain-shelf version: ",
    five_year_old: "In simple words: ",
    sarcastic: "Because apparently we needed the short version: ",
  };

  return prefixes[tone];
}

export function createFallbackSummary(content: string, tone: Tone) {
  const sentences = sentenceSplit(content);
  const lead = sentences[0] ?? normalizeInput(content).slice(0, 180);
  const bullets = sentences.slice(0, 5);

  if (!bullets.length) {
    return "TL;DR: Add more readable text so Snipd can summarize it.";
  }

  return [
    `TL;DR: ${tonePrefix(tone)}${lead}`,
    "",
    ...bullets.map((sentence) => `- ${sentence}`),
    "",
    "Demo mode note: connect Supabase and Anthropic environment variables for saved, AI-powered summaries.",
  ].join("\n");
}
