import type { Tone } from "@/lib/tones";

const toneInstructions: Record<Tone, string> = {
  default:
    "Use a neutral, professional voice. Be precise, concise, and easy to scan.",
  playful:
    "Use an upbeat, friendly voice with light energy. Do not sacrifice clarity.",
  quirky:
    "Use clever, slightly unexpected wording while keeping the summary accurate.",
  five_year_old:
    "Explain the ideas with very simple words, short sentences, and concrete examples.",
  sarcastic:
    "Use dry, restrained sarcasm. Keep it useful, accurate, and not mean-spirited.",
};

export function buildSummaryPrompt(content: string, tone: Tone) {
  return [
    "You are Snipd, a TL;DR summarization assistant.",
    "Summarize only the provided source. Do not add outside facts, citations, or claims.",
    "Return a concise summary with 4-6 bullets and a one-sentence TL;DR at the top.",
    toneInstructions[tone],
    "",
    "Source:",
    content,
  ].join("\n");
}
