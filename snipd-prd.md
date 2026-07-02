# Snipd Product Requirements Document

## 1. Product Name and One-Line Description

**Product name:** Snipd

**One-line description:** Snipd is a TL;DR summarizer web app that turns pasted text and uploaded documents into concise AI-powered summaries in multiple tones.

## 2. Problem Statement

Students, researchers, professionals, journalists, and content creators regularly need to process long-form content quickly, but reading full articles, reports, papers, notes, and documents can be time-consuming. Existing summarization tools often feel generic, lack flexible tone options, or do not support both pasted text and common document formats in one simple workflow.

Snipd solves this by giving users a fast, focused way to submit text or documents and receive a clear, concise summary in a tone that fits their context, whether they need something neutral, playful, simplified, quirky, or sarcastic.

## 3. Target User Profile

**Primary audience:** Users aged 18-45 who frequently consume, analyze, or repurpose written content.

**User segments:**

- **Students:** Need quick summaries of readings, lecture notes, articles, and study materials.
- **Researchers:** Need concise overviews of papers, reports, and reference material.
- **Professionals:** Need fast takeaways from business documents, meeting notes, memos, and reports.
- **Journalists:** Need quick context from source material, transcripts, reports, and background documents.
- **Content creators:** Need digestible summaries of articles, scripts, research, newsletters, and long-form content.

**Common needs:**

- Save time when reviewing long content.
- Understand key points without reading everything.
- Choose a tone that matches the use case.
- Upload common document types without manual conversion.
- Save and revisit previous summaries.

## 4. Core Features for V1

### Feature 1: Text Paste Summarization

Users can paste raw text into the app and generate a concise AI-powered summary.

**User stories:**

- As a student, I want to paste lecture notes so I can quickly review the most important points.
- As a professional, I want to paste a long memo so I can understand the key takeaways before a meeting.
- As a content creator, I want to paste source material so I can quickly identify ideas worth repurposing.

**Definition of done:**

- User can paste text into a dedicated input field.
- App validates that pasted text is not empty.
- App enforces a reasonable character limit for v1.
- User can submit text for summarization.
- Generated summary is displayed clearly on the page.
- Loading, success, validation, and error states are implemented.

### Feature 2: Document Upload Summarization

Users can upload PDF, DOCX, or TXT files and generate summaries from extracted document text.

**User stories:**

- As a researcher, I want to upload a PDF paper so I can get a quick overview before reading deeply.
- As a journalist, I want to upload a report so I can quickly extract the main points.
- As a professional, I want to upload a DOCX file so I can summarize a document without copying and pasting.

**Definition of done:**

- User can upload `.pdf`, `.docx`, and `.txt` files.
- Unsupported file types are rejected with a clear message.
- File size limits are enforced.
- Uploaded files are stored in Supabase Storage.
- Text is extracted from supported file types.
- Extracted text can be sent to the summarization API.
- User receives a clear error if text extraction fails.

### Feature 3: Tone Selection

Users can choose one of five summary tones: Default, Playful, Quirky, 5-Year-Old, and Sarcastic.

**User stories:**

- As a student, I want a 5-Year-Old tone so difficult concepts are explained simply.
- As a content creator, I want a Playful tone so summaries feel more engaging.
- As a professional, I want a Default tone so summaries stay clear and appropriate for work.
- As a casual user, I want a Sarcastic tone so summaries feel more entertaining.

**Definition of done:**

- User can select exactly one tone before generating a summary.
- Default tone is preselected.
- All five tone options are available.
- Selected tone is sent to the summarization API.
- Claude prompt instructions reflect the selected tone.
- Generated summaries visibly match the selected tone.

### Feature 4: User Authentication and Summary History

Users can create an account, sign in, and access previously generated summaries.

**User stories:**

- As a student, I want to save my summaries so I can review them later.
- As a researcher, I want to see my past document summaries so I can return to useful sources.
- As a professional, I want my summaries tied to my account so my work is private and organized.

**Definition of done:**

- Users can sign up, sign in, and sign out using Supabase Auth.
- Authenticated users can view their summary history.
- Each saved summary includes source type, selected tone, created date, and generated summary.
- Users can open a previous summary from history.
- Users can delete a saved summary.
- Row-level security prevents users from accessing summaries they do not own.

### Feature 5: Summary Output Controls

Users can copy, regenerate, and clear generated summaries.

**User stories:**

- As a journalist, I want to copy a summary so I can use it in my notes.
- As a content creator, I want to regenerate a summary in a different tone so I can compare versions.
- As a professional, I want to clear the current result so I can start a new summary quickly.

**Definition of done:**

- User can copy the generated summary to clipboard.
- User sees confirmation after copying.
- User can regenerate a summary using the same source content and tone.
- User can change tone and regenerate.
- User can clear the current input and output state.

## 5. Explicitly Out of Scope for V1

- Browser extensions.
- Native mobile apps.
- Team workspaces or organization accounts.
- Collaborative editing or shared summary folders.
- Real-time document collaboration.
- Audio or video upload support.
- Image OCR.
- URL/webpage summarization.
- Citation generation.
- Plagiarism detection.
- Fact-checking or source verification.
- Advanced summary length controls beyond a default concise TL;DR.
- Payment, billing, subscriptions, or usage-based plans.
- Multi-language summary support.
- Public sharing pages.
- Integrations with Google Drive, Notion, Slack, Microsoft Office, or CMS tools.

## 6. Tech Stack

### Frontend

- **Framework:** Next.js 14
- **Routing:** App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS or equivalent component-friendly styling system

### Backend

- **Runtime:** Next.js API routes / Route Handlers
- **Authentication:** Supabase Auth
- **Database:** Supabase Postgres
- **File storage:** Supabase Storage
- **AI provider:** Anthropic Claude API

### Suggested Supporting Libraries

- `@supabase/supabase-js` for Supabase client usage.
- `@supabase/ssr` for server-side auth helpers.
- `@anthropic-ai/sdk` for Claude API calls.
- `pdf-parse` or equivalent for PDF text extraction.
- `mammoth` or equivalent for DOCX text extraction.

## 7. API Routes Needed

### `POST /api/summarize`

Generates a summary from submitted text.

**Request body:**

- `sourceType`: `text` or `document`
- `content`: extracted text to summarize
- `tone`: `default`, `playful`, `quirky`, `five_year_old`, or `sarcastic`
- `fileId`: optional Supabase Storage file reference

**Responsibilities:**

- Validate authenticated user.
- Validate submitted content.
- Validate selected tone.
- Build the Claude prompt.
- Call Anthropic Claude API.
- Save summary record to Supabase.
- Return generated summary and metadata.

### `POST /api/upload`

Uploads and processes a document file.

**Request body:**

- Multipart form data containing the uploaded file.

**Responsibilities:**

- Validate authenticated user.
- Validate file type and size.
- Upload file to Supabase Storage.
- Extract text from PDF, DOCX, or TXT file.
- Return extracted text preview, file metadata, and file ID.

### `GET /api/summaries`

Returns the authenticated user's summary history.

**Responsibilities:**

- Validate authenticated user.
- Fetch summaries owned by the user.
- Return summaries ordered by newest first.

### `GET /api/summaries/:id`

Returns a single summary owned by the authenticated user.

**Responsibilities:**

- Validate authenticated user.
- Validate summary ownership.
- Return full summary details.

### `DELETE /api/summaries/:id`

Deletes a summary owned by the authenticated user.

**Responsibilities:**

- Validate authenticated user.
- Validate summary ownership.
- Delete summary record.
- Optionally delete associated uploaded file if no longer needed.

## 8. Environment Variables Required

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=
NEXT_PUBLIC_APP_URL=
```

**Notes:**

- `SUPABASE_SERVICE_ROLE_KEY` must only be used server-side.
- `ANTHROPIC_API_KEY` must only be used server-side.
- `ANTHROPIC_MODEL` should be configurable so the app can upgrade models without code changes.

## 9. Data Model

### `summaries`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | UUID | Primary key |
| `user_id` | UUID | References Supabase Auth user |
| `source_type` | Text | `text` or `document` |
| `source_title` | Text | Optional filename or user-provided title |
| `file_path` | Text | Optional Supabase Storage path |
| `tone` | Text | Selected tone |
| `input_excerpt` | Text | Short preview of source content |
| `summary` | Text | Generated summary |
| `created_at` | Timestamp | Creation date |
| `updated_at` | Timestamp | Last updated date |

### Storage Bucket

**Bucket name:** Configured by `SUPABASE_STORAGE_BUCKET`

**Recommended structure:**

```text
uploads/{user_id}/{file_id}-{filename}
```

## 10. Known Risks and Mitigations

### Risk: Poor summary quality or inconsistent tone

**Mitigation:**

- Use structured Claude prompts with explicit tone instructions.
- Add internal prompt examples for each tone.
- Validate generated output during QA against representative user documents.

### Risk: Large documents exceed model context limits

**Mitigation:**

- Enforce file size and extracted text limits in v1.
- Truncate or chunk text before summarization.
- Clearly notify users when documents are too large.

### Risk: PDF and DOCX text extraction may fail or produce messy text

**Mitigation:**

- Use proven extraction libraries.
- Return user-friendly errors for unreadable files.
- Strip excessive whitespace and normalize extracted text before summarization.

### Risk: Uploaded documents may contain sensitive data

**Mitigation:**

- Require authentication for uploads.
- Use Supabase Row Level Security.
- Store files in user-scoped paths.
- Avoid logging full document contents.
- Make privacy expectations clear in the UI and terms.

### Risk: AI API cost can grow quickly

**Mitigation:**

- Add per-user rate limits.
- Enforce input length limits.
- Store summaries to reduce unnecessary repeat generations.
- Track token usage where possible.

### Risk: Abuse through spam, malicious uploads, or excessive requests

**Mitigation:**

- Validate file type and MIME type.
- Limit upload size.
- Add rate limiting to summarize and upload routes.
- Require authentication for document uploads and history.

### Risk: Hallucinated or misleading summaries

**Mitigation:**

- Position Snipd as a summarization assistant, not a fact-checking tool.
- Instruct Claude to summarize only the provided content.
- Include a lightweight disclaimer that summaries may omit nuance.

## 11. V1 Success Criteria

- Users can sign up and sign in.
- Users can paste text and generate a summary.
- Users can upload PDF, DOCX, and TXT files and generate summaries.
- Users can choose from all five required tones.
- Users can view, copy, regenerate, and delete summaries.
- Summary records are stored securely per user.
- API keys remain server-side only.
- Core flows work on desktop and mobile browsers.

