"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteSummaryButton({ id }: { id: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    const response = await fetch(`/api/summaries/${id}`, { method: "DELETE" });
    setIsDeleting(false);

    if (response.ok) {
      router.push("/history");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="inline-flex items-center gap-2 rounded-md border border-[#e5caca] px-3 py-2 text-sm font-semibold text-[var(--danger)] transition hover:bg-[#fff4f4] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Trash2 className="h-4 w-4" aria-hidden />
      {isDeleting ? "Deleting..." : "Delete"}
    </button>
  );
}
