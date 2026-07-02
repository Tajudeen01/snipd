import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createFallbackSummary } from "@/lib/server/fallback-summary";
import { createClient } from "@/lib/supabase/server";
import { summarizeContent } from "@/lib/server/anthropic";
import { enforceRateLimitPlaceholder, getClientIp } from "@/lib/server/request-guards";
import { makeExcerpt, summarizeRequestSchema, validateContent } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabaseConfigured = hasSupabaseConfig();
  const supabase = supabaseConfigured ? createClient() : null;
  const { data: authData } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } };
  const user = authData.user;

  if (supabaseConfigured && !user) {
    return NextResponse.json({ error: "Sign in to save and generate summaries." }, { status: 401 });
  }

  const rateLimit = await enforceRateLimitPlaceholder(`${user?.id ?? "demo"}:${getClientIp(request)}:summarize`);
  if (!rateLimit.ok) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  const parsed = summarizeRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Send content, source type, and a valid tone." }, { status: 400 });
  }

  const content = validateContent(parsed.data.content);
  if (!content.ok) {
    return NextResponse.json({ error: content.error }, { status: 400 });
  }

  let summary = "";
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      summary = await summarizeContent(content.content, parsed.data.tone);
    } catch {
      summary = createFallbackSummary(content.content, parsed.data.tone);
    }
  } else {
    summary = createFallbackSummary(content.content, parsed.data.tone);
  }

  if (!summary) {
    return NextResponse.json({ error: "The AI returned an empty summary. Try again." }, { status: 502 });
  }

  if (!supabase || !user) {
    return NextResponse.json({
      summary: {
        id: crypto.randomUUID(),
        user_id: "demo",
        source_type: parsed.data.sourceType,
        source_title: parsed.data.sourceTitle ?? null,
        file_path: parsed.data.fileId ?? null,
        tone: parsed.data.tone,
        input_excerpt: makeExcerpt(content.content),
        summary,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      demoMode: true,
    });
  }

  const { data, error } = await supabase
    .from("summaries")
    .insert({
      user_id: user.id,
      source_type: parsed.data.sourceType,
      source_title: parsed.data.sourceTitle ?? null,
      file_path: parsed.data.fileId ?? null,
      tone: parsed.data.tone,
      input_excerpt: makeExcerpt(content.content),
      summary,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: "Summary generated but could not be saved." }, { status: 500 });
  }

  return NextResponse.json({ summary: data });
}
