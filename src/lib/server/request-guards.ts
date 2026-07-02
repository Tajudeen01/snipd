import "server-only";

import type { NextRequest } from "next/server";

export function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function enforceRateLimitPlaceholder(key: string) {
  void key;
  return { ok: true as const };
}
