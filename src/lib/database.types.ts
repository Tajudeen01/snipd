import type { Tone } from "@/lib/tones";
import type { SourceType } from "@/lib/validation";

export type SummaryRecord = {
  id: string;
  user_id: string;
  source_type: SourceType;
  source_title: string | null;
  file_path: string | null;
  tone: Tone;
  input_excerpt: string;
  summary: string;
  created_at: string;
  updated_at: string;
};

export type SummaryInsert = {
  user_id: string;
  source_type: SourceType;
  source_title?: string | null;
  file_path?: string | null;
  tone: Tone;
  input_excerpt: string;
  summary: string;
};
