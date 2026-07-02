"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  Clipboard,
  Eraser,
  FileText,
  History,
  Loader2,
  LogOut,
  RefreshCw,
  Sparkles,
  Upload,
} from "lucide-react";
import type { SummaryRecord } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/client";
import { getToneLabel, tones, type Tone } from "@/lib/tones";
import { cn, formatDate } from "@/lib/utils";
import { MAX_INPUT_CHARACTERS, validateContent, validateUpload, type SourceType } from "@/lib/validation";

type UploadedDocument = {
  fileId: string | null;
  fileName: string;
  extractedText: string;
  preview: string;
};

export function SummarizerWorkspace({
  userEmail,
  initialSummaries,
}: {
  userEmail: string | null;
  initialSummaries: SummaryRecord[];
}) {
  const [sourceType, setSourceType] = useState<SourceType>("text");
  const [text, setText] = useState("");
  const [document, setDocument] = useState<UploadedDocument | null>(null);
  const [tone, setTone] = useState<Tone>("default");
  const [currentSummary, setCurrentSummary] = useState<SummaryRecord | null>(null);
  const [summaries, setSummaries] = useState(initialSummaries);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const activeContent = sourceType === "text" ? text : document?.extractedText ?? "";
  const characterCount = activeContent.length;
  const canGenerate = !isGenerating;
  const recentSummaries = useMemo(() => summaries.slice(0, 5), [summaries]);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError(null);
    setDocument(null);

    if (!file) return;

    const clientValidation = validateUpload(file);
    if (!clientValidation.ok) {
      setError(clientValidation.error);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setIsUploading(true);

    const response = await fetch("/api/upload", { method: "POST", body: formData });
    const payload = await response.json();
    setIsUploading(false);

    if (!response.ok) {
      setError(payload.error ?? "Upload failed.");
      return;
    }

    setSourceType("document");
    setDocument(payload);
  }

  async function handleGenerate() {
    setError(null);
    setCopied(false);

    const liveContent =
      sourceType === "text"
        ? textAreaRef.current?.value ?? text
        : document?.extractedText ?? "";
    const validation = validateContent(liveContent);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    setIsGenerating(true);
    const response = await fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceType,
        content: validation.content,
        tone,
        fileId: document?.fileId ?? undefined,
        sourceTitle: sourceType === "document" ? document?.fileName : "Pasted text",
      }),
    });

    const payload = await response.json();
    setIsGenerating(false);

    if (!response.ok) {
      setError(payload.error ?? "Could not generate a summary.");
      return;
    }

    setCurrentSummary(payload.summary);
    setSummaries((items) => [payload.summary, ...items.filter((item) => item.id !== payload.summary.id)]);
  }

  async function handleCopy() {
    if (!currentSummary) return;
    await navigator.clipboard.writeText(currentSummary.summary);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function handleSignOut() {
    await createClient().auth.signOut();
    window.location.href = "/";
  }

  function clearWorkspace() {
    setText("");
    setDocument(null);
    setCurrentSummary(null);
    setError(null);
    setCopied(false);
    setSourceType("text");
  }

  return (
    <main className="min-h-screen px-4 py-5 text-[var(--foreground)] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="flex flex-col gap-4 border-b border-[var(--line)] pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Snipd</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Compress the read.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--ink-muted)]">
              Paste text or upload a document, choose the voice, and keep the useful bits.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/history" className="inline-flex items-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold transition hover:border-[var(--accent)]">
              <History className="h-4 w-4" aria-hidden />
              History
            </Link>
            {userEmail ? (
              <button type="button" onClick={handleSignOut} className="inline-flex items-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold transition hover:border-[var(--accent)]">
                <LogOut className="h-4 w-4" aria-hidden />
                Sign out
              </button>
            ) : (
              <Link href="/auth" className="rounded-md bg-[var(--foreground)] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]">
                Sign in
              </Link>
            )}
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <div className="rounded-lg border border-[var(--line)] bg-white shadow-sm">
            {isDemoMode ? (
              <div className="border-b border-[var(--line)] bg-[#fff8df] px-4 py-3 text-sm text-[#6f5512]">
                Demo mode is active. Paste and upload flows work locally, but summaries are not saved until Supabase and Anthropic env vars are configured.
              </div>
            ) : null}
            <div className="grid border-b border-[var(--line)] sm:grid-cols-2">
              <button type="button" onClick={() => setSourceType("text")} className={cn("flex items-center gap-2 px-4 py-3 text-left text-sm font-semibold", sourceType === "text" ? "bg-[#edf6ee] text-[var(--accent-strong)]" : "text-[var(--ink-muted)]")}>
                <FileText className="h-4 w-4" aria-hidden />
                Paste text
              </button>
              <button type="button" onClick={() => setSourceType("document")} className={cn("flex items-center gap-2 border-t border-[var(--line)] px-4 py-3 text-left text-sm font-semibold sm:border-l sm:border-t-0", sourceType === "document" ? "bg-[#edf6ee] text-[var(--accent-strong)]" : "text-[var(--ink-muted)]")}>
                <Upload className="h-4 w-4" aria-hidden />
                Upload document
              </button>
            </div>

            <div className="p-4 sm:p-5">
              {sourceType === "text" ? (
                <label className="block">
                  <span className="text-sm font-semibold">Source text</span>
                  <textarea
                    ref={textAreaRef}
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    onInput={(event) => setText(event.currentTarget.value)}
                    maxLength={MAX_INPUT_CHARACTERS + 1}
                    placeholder="Paste notes, articles, memos, research excerpts, or anything that needs a sharper TL;DR."
                    className="mt-3 min-h-[360px] w-full resize-y rounded-md border border-[var(--line)] bg-[#fbfcf8] p-4 text-sm leading-6 outline-none ring-[var(--accent)] focus:ring-2"
                  />
                </label>
              ) : (
                <div className="min-h-[360px] rounded-md border border-dashed border-[var(--line)] bg-[#fbfcf8] p-4">
                  <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-md border border-[var(--line)] bg-white p-6 text-center transition hover:border-[var(--accent)]">
                    <Upload className="h-8 w-8 text-[var(--accent)]" aria-hidden />
                    <span className="mt-3 text-sm font-semibold">{isUploading ? "Extracting text..." : "Choose a PDF, DOCX, or TXT file"}</span>
                    <span className="mt-1 text-xs text-[var(--ink-muted)]">8 MB max for V1</span>
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                      onChange={handleUpload}
                      disabled={isUploading}
                      className="sr-only"
                    />
                  </label>

                  {document ? (
                    <div className="mt-4 rounded-md border border-[var(--line)] bg-white p-4">
                      <p className="text-sm font-semibold">{document.fileName}</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">{document.preview}</p>
                    </div>
                  ) : null}
                </div>
              )}

              <div className="mt-4 flex flex-col gap-3 border-t border-[var(--line)] pt-4">
                <div>
                  <p className="text-sm font-semibold">Tone</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-5">
                    {tones.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setTone(item.value)}
                        title={item.description}
                        className={cn("min-h-11 rounded-md border px-3 py-2 text-sm font-semibold transition", tone === item.value ? "border-[var(--accent)] bg-[#edf6ee] text-[var(--accent-strong)]" : "border-[var(--line)] bg-white text-[var(--ink-muted)] hover:border-[var(--accent)]")}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {error ? <p className="rounded-md border border-[#e7c9c9] bg-[#fff7f7] px-3 py-2 text-sm text-[var(--danger)]">{error}</p> : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-[var(--ink-muted)]">
                    {characterCount.toLocaleString()} / {MAX_INPUT_CHARACTERS.toLocaleString()} characters
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={clearWorkspace} className="inline-flex items-center gap-2 rounded-md border border-[var(--line)] px-3 py-2 text-sm font-semibold transition hover:border-[var(--accent)]">
                      <Eraser className="h-4 w-4" aria-hidden />
                      Clear
                    </button>
                    <button type="button" onClick={handleGenerate} disabled={!canGenerate} className="inline-flex items-center gap-2 rounded-md bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-50">
                      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />}
                      {currentSummary ? "Regenerate" : "Generate summary"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="flex flex-col gap-5">
            <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Output</p>
                  <h2 className="mt-1 text-2xl font-semibold">Current summary</h2>
                </div>
                {currentSummary ? <span className="rounded-full bg-[#edf6ee] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">{getToneLabel(currentSummary.tone)}</span> : null}
              </div>

              <div className="mt-4 min-h-64 rounded-md border border-[var(--line)] bg-[#fbfcf8] p-4">
                {currentSummary ? (
                  <p className="whitespace-pre-wrap text-sm leading-6">{currentSummary.summary}</p>
                ) : (
                  <p className="text-sm leading-6 text-[var(--ink-muted)]">Your TL;DR lands here. The app will save generated summaries to your account history.</p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={handleCopy} disabled={!currentSummary} className="inline-flex items-center gap-2 rounded-md border border-[var(--line)] px-3 py-2 text-sm font-semibold transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50">
                  <Clipboard className="h-4 w-4" aria-hidden />
                  {copied ? "Copied" : "Copy"}
                </button>
                <button type="button" onClick={handleGenerate} disabled={!canGenerate} className="inline-flex items-center gap-2 rounded-md border border-[var(--line)] px-3 py-2 text-sm font-semibold transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50">
                  <RefreshCw className="h-4 w-4" aria-hidden />
                  Regenerate
                </button>
              </div>
            </section>

            <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Recent history</h2>
                <Link href="/history" className="text-sm font-semibold text-[var(--accent-strong)]">View all</Link>
              </div>
              <div className="mt-4 space-y-3">
                {recentSummaries.length ? (
                  recentSummaries.map((item) => (
                    <Link key={item.id} href={`/history/${item.id}`} className="block rounded-md border border-[var(--line)] p-3 transition hover:border-[var(--accent)]">
                      <p className="line-clamp-2 text-sm font-medium">{item.input_excerpt}</p>
                      <p className="mt-2 text-xs text-[var(--ink-muted)]">{getToneLabel(item.tone)} - {formatDate(item.created_at)}</p>
                    </Link>
                  ))
                ) : (
                  <p className="rounded-md border border-[var(--line)] bg-[#fbfcf8] p-3 text-sm text-[var(--ink-muted)]">No saved summaries yet.</p>
                )}
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
