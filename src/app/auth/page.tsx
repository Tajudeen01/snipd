import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";

export default function AuthPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Suspense fallback={<div className="text-sm text-[var(--ink-muted)]">Loading...</div>}>
        <AuthForm />
      </Suspense>
    </main>
  );
}
