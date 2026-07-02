import { NextResponse } from "next/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type Params = {
  params: {
    id: string;
  };
};

export async function GET(_request: Request, { params }: Params) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to view this summary." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("summaries")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error) {
    return NextResponse.json({ error: "Summary not found." }, { status: 404 });
  }

  return NextResponse.json({ summary: data });
}

export async function DELETE(_request: Request, { params }: Params) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to delete this summary." }, { status: 401 });
  }

  const { error } = await supabase.from("summaries").delete().eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: "Could not delete this summary." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
