import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DeleteSummaryButton } from "@/components/DeleteSummaryButton";
import type { SummaryRecord } from "@/lib/database.types";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getToneLabel } from "@/lib/tones";
import { formatDate } from "@/lib/utils";

export default async function SummaryDetailPage({
  params,
}: {
  params: { id: string };
}) {
  if (!hasSupabaseConfig()) {
    redirect(`/auth?redirect=/history/${params.id}`);
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth?redirect=/history/${params.id}`);
  }

  const { data, error } = await supabase
    .from("summaries")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    notFound();
  }

  const summary = data as SummaryRecord;

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-3 border-b border-[var(--line)] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/history" className="text-sm font-semibold text-[var(--accent-strong)]">
              Back to history
            </Link>
            <h1 className="mt-3 text-4xl font-semibold">{summary.source_title ?? "Saved summary"}</h1>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">
              {summary.source_type} - {getToneLabel(summary.tone)} - {formatDate(summary.created_at)}
            </p>
          </div>
          <DeleteSummaryButton id={summary.id} />
        </div>

        <section className="mt-5 rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Summary</h2>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7">{summary.summary}</p>
        </section>

        <section className="mt-5 rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Source excerpt</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--ink-muted)]">{summary.input_excerpt}</p>
        </section>
      </article>
    </main>
  );
}
