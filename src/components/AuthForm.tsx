"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseConfig } from "@/lib/supabase/config";

type Mode = "sign-in" | "sign-up";

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hasSupabaseConfig()) {
      setMessage("Add Supabase environment variables before using authentication.");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const redirectTo = searchParams.get("redirect") || "/";
    const supabase = createClient();
    const result =
      mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}${redirectTo}` },
          });

    setIsSubmitting(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (mode === "sign-up" && !result.data.session) {
      setMessage("Check your inbox to confirm your account, then sign in.");
      return;
    }

    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg border border-[var(--line)] bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Snipd account</p>
        <h1 className="mt-2 text-3xl font-semibold">Keep your summaries close.</h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">Sign in to generate, save, revisit, and delete TL;DRs.</p>
      </div>

      <div className="mb-5 grid grid-cols-2 rounded-md border border-[var(--line)] bg-[#f3f6ef] p-1">
        {(["sign-in", "sign-up"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMode(item)}
            className={`rounded px-3 py-2 text-sm font-semibold ${mode === item ? "bg-white shadow-sm" : "text-[var(--ink-muted)]"}`}
          >
            {item === "sign-in" ? "Sign in" : "Sign up"}
          </button>
        ))}
      </div>

      <label className="block text-sm font-medium" htmlFor="email">
        Email
      </label>
      <input
        id="email"
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="mt-2 w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 outline-none ring-[var(--accent)] focus:ring-2"
      />

      <label className="mt-4 block text-sm font-medium" htmlFor="password">
        Password
      </label>
      <input
        id="password"
        type="password"
        required
        minLength={6}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="mt-2 w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 outline-none ring-[var(--accent)] focus:ring-2"
      />

      {message ? (
        <p className="mt-4 rounded-md border border-[var(--line)] bg-[#f9fbf5] px-3 py-2 text-sm text-[var(--ink-muted)]">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 w-full rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Working..." : mode === "sign-in" ? "Sign in" : "Create account"}
      </button>
    </form>
  );
}
