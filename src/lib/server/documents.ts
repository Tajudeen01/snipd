import "server-only";

import * as mammoth from "mammoth";
import { normalizeInput, type AllowedMimeType } from "@/lib/validation";

export async function extractTextFromDocument(
  buffer: Buffer,
  mimeType: AllowedMimeType,
) {
  if (mimeType === "text/plain") {
    return normalizeInput(buffer.toString("utf8"));
  }

  if (mimeType === "application/pdf") {
    const { PDFParse } = (await new Function(
      "return import('pdf-parse')",
    )()) as typeof import("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      const result = await parser.getText();
      return normalizeInput(result.text);
    } finally {
      await parser.destroy();
    }
  }

  const result = await mammoth.extractRawText({ buffer });
  return normalizeInput(result.value);
}
