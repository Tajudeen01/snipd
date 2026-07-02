import Link from "next/link";
import { redirect } from "next/navigation";
import type { SummaryRecord } from "@/lib/database.types";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getToneLabel } from "@/lib/tones";
import { formatDate } from "@/lib/utils";

export default async function HistoryPage() {
  if (!hasSupabaseConfig()) {
    redirect("/auth?redirect=/history");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?redirect=/history");
  }

  const { data } = await supabase
    .from("summaries")
    .select("*")
    .order("created_at", { ascending: false });

  const summaries = (data ?? []) as SummaryRecord[];

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-3 border-b border-[var(--line)] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/" className="text-sm font-semibold text-[var(--accent-strong)]">
              Back to workspace
            </Link>
            <h1 className="mt-3 text-4xl font-semibold">Summary history</h1>
          </div>
          <p className="text-sm text-[var(--ink-muted)]">{summaries.length} saved summaries</p>
        </div>

        <div className="mt-5 grid gap-3">
          {summaries.length ? (
            summaries.map((summary) => (
              <Link
                key={summary.id}
                href={`/history/${summary.id}`}
                className="rounded-lg border border-[var(--line)] bg-white p-4 shadow-sm transition hover:border-[var(--accent)]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="line-clamp-2 text-sm font-medium">{summary.input_excerpt}</p>
                    <p className="mt-2 text-xs text-[var(--ink-muted)]">
                      {summary.source_type} - {getToneLabel(summary.tone)} - {formatDate(summary.created_at)}
                    </p>
                  </div>
                  <span className="w-fit rounded-full bg-[#edf6ee] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
                    {summary.source_title ?? "Untitled"}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-lg border border-[var(--line)] bg-white p-6 text-sm text-[var(--ink-muted)]">
              No summaries yet. Generate one from the workspace and it will appear here.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
