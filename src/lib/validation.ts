import { z } from "zod";
import { toneValues } from "@/lib/tones";

export const MAX_INPUT_CHARACTERS = 24000;
export const MIN_INPUT_CHARACTERS = 20;
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export const sourceTypes = ["text", "document"] as const;
export type SourceType = (typeof sourceTypes)[number];

export const summarizeRequestSchema = z.object({
  sourceType: z.enum(sourceTypes),
  content: z.string(),
  tone: z.enum(toneValues),
  fileId: z.string().optional(),
  sourceTitle: z.string().max(180).optional(),
});

export const allowedUploadTypes = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "text/plain": "txt",
} as const;

export type AllowedMimeType = keyof typeof allowedUploadTypes;

export function normalizeInput(value: string) {
  return value.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

export function makeExcerpt(value: string, length = 320) {
  const normalized = normalizeInput(value);
  return normalized.length > length ? `${normalized.slice(0, length - 1)}...` : normalized;
}

export function validateContent(value: string) {
  const normalized = normalizeInput(value);

  if (normalized.length < MIN_INPUT_CHARACTERS) {
    return {
      ok: false as const,
      error: `Add at least ${MIN_INPUT_CHARACTERS} characters before summarizing.`,
    };
  }

  if (normalized.length > MAX_INPUT_CHARACTERS) {
    return {
      ok: false as const,
      error: `Keep input under ${MAX_INPUT_CHARACTERS.toLocaleString()} characters for V1.`,
    };
  }

  return { ok: true as const, content: normalized };
}

export function validateUpload(file: File) {
  if (!file.size) {
    return { ok: false as const, error: "Choose a file with readable content." };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false as const, error: "Files must be 8 MB or smaller for V1." };
  }

  if (!(file.type in allowedUploadTypes)) {
    return { ok: false as const, error: "Upload a PDF, DOCX, or TXT file." };
  }

  return {
    ok: true as const,
    extension: allowedUploadTypes[file.type as AllowedMimeType],
  };
}
