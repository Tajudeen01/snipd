"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { Dispatch, RefObject, SetStateAction, SVGProps } from "react";
import {
  ChevronDown,
  Clipboard,
  FileText,
  Loader2,
  Mic,
  MoreHorizontal,
  Paperclip,
  Plus,
  Send,
  Video,
  X,
} from "lucide-react";
import type { SummaryRecord } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/client";
import { getToneLabel, tones, type Tone } from "@/lib/tones";
import { cn, formatDate } from "@/lib/utils";
import { validateContent, validateUpload, type SourceType } from "@/lib/validation";

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
  const [uploadedDocument, setUploadedDocument] = useState<UploadedDocument | null>(null);
  const [tone, setTone] = useState<Tone>("default");
  const [currentSummary, setCurrentSummary] = useState<SummaryRecord | null>(null);
  const [, setSummaries] = useState(initialSummaries);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sourceMenuOpen, setSourceMenuOpen] = useState(false);
  const [toneMenuOpen, setToneMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const recentDocuments = uploadedDocument ? [uploadedDocument] : [];
  const profileName = userEmail?.split("@")[0]?.replace(/[._-]+/g, " ") || "Bolarinwa ahmed";
  const displayName = profileName.split(" ")[0] || profileName;
  const activeContent = sourceType === "text" ? text : uploadedDocument?.extractedText ?? "";
  const selectedTone = getToneLabel(tone);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError(null);

    if (!file) return;

    const clientValidation = validateUpload(file);
    if (!clientValidation.ok) {
      setError(clientValidation.error);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setIsUploading(true);
    setSourceMenuOpen(false);

    const response = await fetch("/api/upload", { method: "POST", body: formData });
    const payload = await response.json();
    setIsUploading(false);

    if (!response.ok) {
      setError(payload.error ?? "Upload failed.");
      return;
    }

    setSourceType("document");
    setUploadedDocument(payload);
  }

  async function handleGenerate() {
    setError(null);
    setCopied(false);

    const liveContent =
      sourceType === "text"
        ? textAreaRef.current?.value ?? text
        : uploadedDocument?.extractedText ?? "";

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
        fileId: uploadedDocument?.fileId ?? undefined,
        sourceTitle: sourceType === "document" ? uploadedDocument?.fileName : "Pasted text",
      }),
    });

    const payload = await response.json();
    setIsGenerating(false);

    if (!response.ok) {
      setError(payload.error ?? "Could not generate a summary.");
      return;
    }

    setCurrentSummary(payload.summary);
    setSummaries((items) => [
      payload.summary,
      ...items.filter((item) => item.id !== payload.summary.id),
    ]);
  }

  async function handleCopy() {
    if (!currentSummary) return;
    await navigator.clipboard.writeText(currentSummary.summary);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function handleDownload() {
    if (!currentSummary) return;

    const blob = new Blob([currentSummary.summary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${currentSummary.source_title ?? "snipd-summary"}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleSignOut() {
    await createClient().auth.signOut();
    window.location.href = "/";
  }

  function startNewChat() {
    setText("");
    setUploadedDocument(null);
    setCurrentSummary(null);
    setError(null);
    setCopied(false);
    setSourceType("text");
    setSourceMenuOpen(false);
  }

  function removeDocument() {
    setUploadedDocument(null);
    setSourceType("text");
  }

  return (
    <main className="snipd-shell min-h-screen bg-white text-[#2d2d2d]">
      <div className="flex min-h-screen w-full bg-white">
        <aside className="my-2 ml-2 hidden h-[calc(100vh-16px)] min-h-[640px] w-[250px] shrink-0 flex-col overflow-hidden rounded-[12px] bg-[#f6f6f4] md:flex">
          <div className="flex h-14 w-full items-center px-3 py-4">
            <Link href="/" className="text-[16px] font-semibold leading-6 text-[#121212]">
              Snipd
            </Link>
          </div>

          <nav className="flex w-full flex-col items-start gap-4 px-3 pt-2" aria-label="Workspace">
            <button
              type="button"
              onClick={startNewChat}
              className="group flex h-9 w-full items-center gap-1.5 rounded-[10px] p-2 text-left text-[14px] font-normal leading-5 text-[#65605c] transition-colors duration-150 ease-[var(--ease-snappy)] hover:bg-white hover:text-[#4d4845] focus-visible:outline-offset-2 active:bg-white active:text-[#4d4845]"
            >
              <DocumentTextIcon className="h-4 w-4 shrink-0 text-[#4d4845]" aria-hidden />
              New chat
            </button>

            <div className="flex h-8 w-full items-center rounded-[14px] py-1.5">
              <p className="text-[14px] font-normal leading-5 text-[#999]">Recent files</p>
            </div>

            {recentDocuments.length ? (
              <div className="w-full space-y-1">
                {recentDocuments.map((item) => (
                  <button
                    key={item.fileId ?? item.fileName}
                    type="button"
                    onClick={() => {
                      setSourceType("document");
                      setUploadedDocument(item);
                    }}
                    className="flex h-9 w-full items-center gap-1.5 rounded-[10px] p-2 text-left text-[14px] font-normal leading-5 text-[#65605c] transition-colors duration-150 ease-[var(--ease-snappy)] hover:bg-[#eeeeeb] hover:text-[#65605c] active:bg-[#e8e8e4]"
                    title={item.fileName}
                  >
                    <DocumentTextIcon className="h-4 w-4 shrink-0 text-[#4d4845]" aria-hidden />
                    <span className="min-w-0 truncate">{item.fileName}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </nav>

          <div className="mt-auto px-3 pb-4">
            <div className="group flex h-[52px] w-full items-center justify-between overflow-hidden rounded-[14px] border border-transparent bg-transparent p-2.5 transition-colors duration-150 ease-[var(--ease-snappy)] hover:border-[#f4f4f2] hover:bg-white hover:text-[#65605c] active:border-[#f4f4f2] active:bg-white">
              <div className="flex min-w-0 items-center gap-2">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#202020] text-[12px] font-semibold leading-4 text-white">
                  {profileName.slice(0, 1).toUpperCase()}
                </div>
                <p className="truncate text-[14px] font-normal leading-5 text-[#65605c]">{profileName}</p>
              </div>
              {userEmail ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="grid h-4 w-4 shrink-0 place-items-center rounded-full text-[#a6a4a0] transition-colors duration-150 group-hover:text-[#a6a4a0] hover:text-[#4d4845]"
                  aria-label="Sign out"
                >
                  <MoreHorizontal className="h-4 w-4" strokeWidth={2} aria-hidden />
                </button>
              ) : (
                <Link
                  href="/auth"
                  className="grid h-4 w-4 shrink-0 place-items-center rounded-full text-[#a6a4a0] transition-colors duration-150 group-hover:text-[#a6a4a0] hover:text-[#4d4845]"
                  aria-label="Sign in"
                >
                  <MoreHorizontal className="h-4 w-4" strokeWidth={2} aria-hidden />
                </Link>
              )}
            </div>
          </div>
        </aside>

        <section className="relative flex min-h-screen min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden bg-white">
          <header className="absolute right-[clamp(2rem,4vw,4.5rem)] top-7 z-20 flex items-center gap-5 max-sm:right-4 max-sm:top-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => setToneMenuOpen((open) => !open)}
                className="group flex h-11 items-stretch overflow-hidden rounded-[12px] text-[14px] font-normal leading-5 text-[#65605c] transition-colors duration-150 ease-[var(--ease-snappy)] active:brightness-[0.98] max-sm:min-w-[132px]"
                aria-label="Select summary tone"
              >
                <span className="flex min-w-[133px] items-center bg-[#f6f6f4] px-3 transition-colors duration-150 ease-[var(--ease-snappy)] group-hover:bg-[#eeeeeb]">
                  {tone === "default" ? "Professional" : selectedTone}
                </span>
                <span className="grid w-10 place-items-center border-l-[1.4px] border-white bg-[#f6f6f4] transition-colors duration-150 ease-[var(--ease-snappy)] group-hover:bg-[#eeeeeb]">
                  <ChevronDown className="h-4 w-4 text-[#a6a4a0]" aria-hidden />
                </span>
              </button>
              {toneMenuOpen ? (
                <div className="absolute right-0 top-[52px] z-30 w-56 rounded-[16px] border border-[#ededed] bg-white p-2 shadow-[0_20px_60px_rgba(0,0,0,0.10)] animate-pop">
                  {tones.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        setTone(item.value);
                        setToneMenuOpen(false);
                      }}
                      className={cn(
                        "block w-full rounded-[12px] px-3 py-2.5 text-left text-[14px] transition",
                        tone === item.value
                          ? "bg-[#f4f4f2] font-semibold text-[#252525]"
                          : "text-[#6f6f6f] hover:bg-[#f7f7f7]",
                      )}
                    >
                      {item.value === "default" ? "Professional" : item.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={handleDownload}
              disabled={!currentSummary}
              className={cn(
                "group flex h-11 overflow-hidden rounded-[12px] text-[14px] font-normal leading-5 text-white transition-colors duration-150 ease-[var(--ease-snappy)] active:brightness-[0.98] disabled:cursor-not-allowed disabled:opacity-100",
              )}
              aria-label="Download summary"
            >
              <span className="flex items-center bg-[#0046ff] px-3 transition-colors duration-150 ease-[var(--ease-snappy)] group-hover:bg-[#003fe6] max-sm:hidden">
                Download
              </span>
              <span className="grid w-10 place-items-center border-l border-white bg-[#0046ff] transition-colors duration-150 ease-[var(--ease-snappy)] group-hover:bg-[#003fe6]">
                <ChevronDown className="h-4 w-4" aria-hidden />
              </span>
            </button>
          </header>

          <div className="flex flex-1 flex-col px-5 pb-7 pt-24 sm:px-10 lg:px-[clamp(4rem,6vw,7.5rem)]">
            {currentSummary ? (
              <SummaryDocument
                summary={currentSummary}
                copied={copied}
                onCopy={handleCopy}
              />
            ) : (
              <IntroPanel
                displayName={displayName}
                uploadedDocument={uploadedDocument}
                error={error}
                isGenerating={isGenerating}
                isUploading={isUploading}
                sourceMenuOpen={sourceMenuOpen}
                setSourceMenuOpen={setSourceMenuOpen}
                fileInputRef={fileInputRef}
                textAreaRef={textAreaRef}
                text={text}
                setText={setText}
                handleGenerate={handleGenerate}
                handleUpload={handleUpload}
                removeDocument={removeDocument}
                activeContent={activeContent}
              />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function DocumentTextIcon({
  className,
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M9.43 1.67H5.13c-1.91 0-3.05 1.14-3.05 3.05v6.56c0 1.91 1.14 3.05 3.05 3.05h5.74c1.91 0 3.05-1.14 3.05-3.05V6.16h-2.13c-1.5 0-2.36-.86-2.36-2.36V1.67ZM5.33 8.42h2.66a.5.5 0 0 1 0 1H5.33a.5.5 0 0 1 0-1Zm0 2.33h5.34a.5.5 0 0 1 0 1H5.33a.5.5 0 0 1 0-1Z"
        fill="currentColor"
      />
      <path
        d="M10.43 1.93V3.8c0 .94.42 1.36 1.36 1.36h1.87a3.1 3.1 0 0 0-.67-.9L11.33 2.6a3.1 3.1 0 0 0-.9-.67Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IntroPanel({
  displayName,
  uploadedDocument,
  error,
  isGenerating,
  isUploading,
  sourceMenuOpen,
  setSourceMenuOpen,
  fileInputRef,
  textAreaRef,
  text,
  setText,
  handleGenerate,
  handleUpload,
  removeDocument,
  activeContent,
}: {
  displayName: string;
  uploadedDocument: UploadedDocument | null;
  error: string | null;
  isGenerating: boolean;
  isUploading: boolean;
  sourceMenuOpen: boolean;
  setSourceMenuOpen: Dispatch<SetStateAction<boolean>>;
  fileInputRef: RefObject<HTMLInputElement>;
  textAreaRef: RefObject<HTMLTextAreaElement>;
  text: string;
  setText: Dispatch<SetStateAction<string>>;
  handleGenerate: () => void;
  handleUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  removeDocument: () => void;
  activeContent: string;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-1 flex-col items-center justify-center pb-24">
      <div className="text-center animate-rise">
        <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-[#303030] sm:text-[34px]">
          Hi, {displayName}
        </h1>
        <p className="mx-auto mt-3 max-w-[560px] text-balance text-[16px] leading-7 text-[#8a8a8a]">
          Upload documents, paste text, or type directly to start summarizing.
          Get clear, concise summaries in seconds.
        </p>
      </div>

      <div className="relative mt-12 w-full animate-rise [animation-delay:60ms]">
        {uploadedDocument ? (
          <div className="mb-4 flex justify-center">
            <div className="flex min-w-[270px] items-center gap-3 rounded-[15px] bg-[#f5f5f3] px-4 py-3">
              <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-white text-[#ef3d2f]">
                <FileText className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-[#5d5d5d]">{uploadedDocument.fileName}</p>
                <p className="text-[13px] font-medium text-[#aaa]">Document</p>
              </div>
              <button
                type="button"
                onClick={removeDocument}
                className="grid h-7 w-7 place-items-center rounded-full text-[#777] transition hover:bg-white"
                aria-label="Remove file"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-[18px] bg-[#f7f7f5] shadow-[0_12px_40px_rgba(0,0,0,0.045)] transition focus-within:shadow-[0_18px_55px_rgba(0,0,0,0.08)]">
          <textarea
            ref={textAreaRef}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onInput={(event) => setText(event.currentTarget.value)}
            disabled={Boolean(uploadedDocument)}
            placeholder={uploadedDocument ? "Ready to summarize the uploaded document" : "Start typing or paste a web link"}
            className="h-[58px] w-full resize-none overflow-hidden bg-white px-5 py-5 text-[14px] font-medium text-[#555] outline-none placeholder:text-[#c4c4c4] disabled:cursor-not-allowed"
          />
          <div className="flex min-h-[58px] items-center justify-between gap-3 px-4 py-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setSourceMenuOpen((open) => !open)}
                className="grid h-10 w-10 place-items-center rounded-full text-[#777] transition hover:bg-white hover:text-[#222] active:scale-95"
                aria-label="Add source"
              >
                <Plus className="h-5 w-5" aria-hidden />
              </button>

              {sourceMenuOpen ? (
                <div className="absolute left-0 top-12 z-20 w-[260px] rounded-[18px] border border-[#eeeeec] bg-white p-2 shadow-[0_22px_70px_rgba(0,0,0,0.12)] animate-pop">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center gap-3 rounded-[13px] px-3 py-3 text-left text-[14px] font-medium text-[#555] transition hover:bg-[#f7f7f5]"
                  >
                    <Paperclip className="h-5 w-5 text-[#5c5c5c]" aria-hidden />
                    Add a file
                  </button>
                  <div className="flex items-center justify-between rounded-[13px] px-3 py-3 text-[14px] font-medium text-[#777]">
                    <span className="flex items-center gap-3">
                      <Video className="h-5 w-5 text-[#5c5c5c]" aria-hidden />
                      Video upload
                    </span>
                    <span className="rounded-full bg-[#f1f1ef] px-2.5 py-1 text-[12px] text-[#aaa]">Soon</span>
                  </div>
                  <div className="flex items-center justify-between rounded-[13px] px-3 py-3 text-[14px] font-medium text-[#777]">
                    <span className="flex items-center gap-3">
                      <Mic className="h-5 w-5 text-[#5c5c5c]" aria-hidden />
                      Audio upload
                    </span>
                    <span className="rounded-full bg-[#f1f1ef] px-2.5 py-1 text-[12px] text-[#aaa]">Soon</span>
                  </div>
                </div>
              ) : null}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={handleUpload}
                disabled={isUploading}
                className="sr-only"
              />
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || isUploading}
              className="grid h-10 w-10 place-items-center rounded-[11px] bg-[#050505] text-white shadow-[0_12px_24px_rgba(0,0,0,0.18)] transition hover:translate-y-[-1px] hover:bg-[#181818] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Generate summary"
            >
              {isGenerating || isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Send className="h-4 w-4" aria-hidden />
              )}
            </button>
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-[14px] bg-[#fff2f0] px-4 py-3 text-center text-[14px] font-medium text-[#c14b3f] animate-rise">
            {error}
          </p>
        ) : null}

        {activeContent ? (
          <p className="mt-3 text-center text-[12px] font-medium text-[#b5b5b5]">
            {activeContent.length.toLocaleString()} characters ready
          </p>
        ) : null}
      </div>
    </div>
  );
}

function SummaryDocument({
  summary,
  copied,
  onCopy,
}: {
  summary: SummaryRecord;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[980px] flex-1 flex-col pt-24 lg:pt-28">
      <div className="mb-10 flex justify-center animate-rise">
        <div className="flex min-w-[305px] items-center gap-3 rounded-[15px] bg-[#f5f5f3] px-4 py-3">
          <div className="grid h-10 w-10 place-items-center rounded-[11px] bg-white text-[#ef3d2f]">
            <FileText className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-[#5d5d5d]">
              {summary.source_title ?? "Summary"}
            </p>
            <p className="text-[13px] font-medium uppercase text-[#aaa]">{summary.source_type}</p>
          </div>
        </div>
      </div>

      <article className="max-w-[860px] animate-rise [animation-delay:70ms]">
        <p className="mb-4 text-[13px] font-medium text-[#a7a7a7]">
          {getToneLabel(summary.tone)} summary - {formatDate(summary.created_at)}
        </p>
        <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-[#424242] sm:text-[34px]">
          Summary: {summary.source_title ?? "Snipd"}
        </h1>
        <div className="mt-7 whitespace-pre-wrap text-[16px] leading-8 text-[#666]">
          {summary.summary}
        </div>
      </article>

      <div className="mt-auto pt-8">
        <div className="mx-auto flex max-w-[860px] items-center gap-3 rounded-[16px] border border-[#efefed] bg-white p-2 shadow-[0_14px_45px_rgba(0,0,0,0.06)]">
          <div className="flex min-h-[42px] flex-1 items-center rounded-[12px] bg-[#fafaf8] px-4 text-[14px] text-[#b6b6b6]">
            Start typing
          </div>
          <button
            type="button"
            onClick={onCopy}
            className="grid h-11 w-11 place-items-center rounded-[12px] bg-[#050505] text-white shadow-[0_12px_24px_rgba(0,0,0,0.18)] transition hover:translate-y-[-1px] hover:bg-[#181818] active:scale-95"
            aria-label="Copy summary"
            title={copied ? "Copied" : "Copy summary"}
          >
            <Clipboard className="h-4 w-4" aria-hidden />
          </button>
        </div>
        {copied ? (
          <p className="mt-3 text-center text-[13px] font-medium text-[#777]">Copied</p>
        ) : null}
      </div>
    </div>
  );
}
