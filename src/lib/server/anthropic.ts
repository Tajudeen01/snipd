import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { buildSummaryPrompt } from "@/lib/prompts";
import type { Tone } from "@/lib/tones";

function requireServerEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getAnthropicClient() {
  return new Anthropic({
    apiKey: requireServerEnv("ANTHROPIC_API_KEY"),
  });
}

export async function summarizeContent(content: string, tone: Tone) {
  const model = process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest";
  const response = await getAnthropicClient().messages.create({
    model,
    max_tokens: 700,
    temperature: 0.4,
    system: "You create faithful, concise summaries of user-provided text.",
    messages: [
      {
        role: "user",
        content: buildSummaryPrompt(content, tone),
      },
    ],
  });

  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}
