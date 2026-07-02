import { randomUUID } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { extractTextFromDocument } from "@/lib/server/documents";
import { enforceRateLimitPlaceholder, getClientIp } from "@/lib/server/request-guards";
import { makeExcerpt, validateContent, validateUpload, type AllowedMimeType } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabaseConfigured = hasSupabaseConfig();
  const supabase = supabaseConfigured ? createClient() : null;
  const { data: authData } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } };
  const user = authData.user;

  if (supabaseConfigured && !user) {
    return NextResponse.json({ error: "Sign in before uploading documents." }, { status: 401 });
  }

  const rateLimit = await enforceRateLimitPlaceholder(`${user?.id ?? "demo"}:${getClientIp(request)}:upload`);
  if (!rateLimit.ok) {
    return NextResponse.json({ error: "Too many uploads. Try again shortly." }, { status: 429 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Attach a PDF, DOCX, or TXT file." }, { status: 400 });
  }

  const upload = validateUpload(file);
  if (!upload.ok) {
    return NextResponse.json({ error: upload.error }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const extractedText = await extractTextFromDocument(buffer, file.type as AllowedMimeType);
  const content = validateContent(extractedText);

  if (!content.ok) {
    return NextResponse.json({ error: "Text extraction did not find enough readable text." }, { status: 422 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `uploads/${user?.id ?? "demo"}/${randomUUID()}-${safeName}`;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET;

  if (!supabaseConfigured || !bucket || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({
      fileId: null,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      extractedText: content.content,
      preview: makeExcerpt(content.content, 500),
      demoMode: true,
    });
  }

  const { error } = await createAdminClient()
    .storage
    .from(bucket)
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: "File could not be stored. Check the storage bucket setup." }, { status: 500 });
  }

  return NextResponse.json({
    fileId: filePath,
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
    extractedText: content.content,
    preview: makeExcerpt(content.content, 500),
  });
}
