import { describe, expect, it } from "vitest";
import { buildSummaryPrompt } from "./prompts";
import { isTone } from "./tones";
import { makeExcerpt, normalizeInput, validateContent } from "./validation";

describe("validation utilities", () => {
  it("normalizes repeated whitespace", () => {
    expect(normalizeInput(" One   line\r\n\r\n\r\nTwo ")).toBe("One line\n\nTwo");
  });

  it("rejects empty or tiny content", () => {
    expect(validateContent("short").ok).toBe(false);
  });

  it("creates bounded excerpts", () => {
    expect(makeExcerpt("a".repeat(20), 12)).toBe("aaaaaaaaaaa...");
  });
});

describe("tone and prompt utilities", () => {
  it("accepts the required PRD tones", () => {
    expect(isTone("default")).toBe(true);
    expect(isTone("playful")).toBe(true);
    expect(isTone("quirky")).toBe(true);
    expect(isTone("five_year_old")).toBe(true);
    expect(isTone("sarcastic")).toBe(true);
  });

  it("includes tone-specific instruction text", () => {
    expect(buildSummaryPrompt("A source long enough to summarize.", "sarcastic")).toContain("sarcasm");
  });
});
