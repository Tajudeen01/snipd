import { SummarizerWorkspace } from "@/components/SummarizerWorkspace";
import type { SummaryRecord } from "@/lib/database.types";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  if (!hasSupabaseConfig()) {
    return <SummarizerWorkspace userEmail={null} initialSummaries={[]} />;
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let summaries: SummaryRecord[] = [];

  if (user) {
    const { data } = await supabase
      .from("summaries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(8);

    summaries = (data ?? []) as SummaryRecord[];
  }

  return <SummarizerWorkspace userEmail={user?.email ?? null} initialSummaries={summaries} />;
}
