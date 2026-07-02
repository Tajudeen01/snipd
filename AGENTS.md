# AGENTS.md

Guidance for AI agents working in this repository.

## Project Overview

Snipd is a TL;DR summarizer built with Next.js 14 App Router, TypeScript, Tailwind CSS, Supabase, and Anthropic Claude. The app supports pasted text, PDF/DOCX/TXT uploads, tone selection, authentication, saved summary history, and Supabase-backed persistence.

## Local Setup

- Use `npm.cmd install` to install dependencies.
- Copy `.env.example` to `.env.local` and fill in Supabase plus Anthropic values before testing real auth, uploads, or generation.
- Run the app with `npm.cmd run dev` and open `http://localhost:3000`.
- Use `npm.cmd run lint`, `npm.cmd run test`, and `npm.cmd run build` for verification.

## Repository Map

- `src/app/` contains routes, layouts, pages, and API handlers.
- `src/components/` contains client UI components.
- `src/lib/` contains shared validation, tones, prompts, types, and utility code.
- `src/lib/server/` contains server-only document extraction, Anthropic, and request guard logic.
- `src/lib/supabase/` contains Supabase clients, config checks, and middleware helpers.
- `supabase/migrations/` contains database schema, RLS policies, and storage setup notes.
- `snipd-prd.md` is the product reference for V1 scope and behavior.

## Coding Conventions

- Prefer existing patterns and small, focused changes.
- Keep TypeScript strict and avoid `any` unless there is a clear boundary that cannot be typed better.
- Use the `@/` path alias for imports from `src`.
- Keep shared validation in `src/lib/validation.ts`; do not duplicate request validation across routes and components.
- Keep tone values centralized in `src/lib/tones.ts`; update tests when adding or changing tones.
- Use server-only code from API routes, server components, or files under `src/lib/server/`.
- Keep API handlers explicit about status codes and JSON error shapes.
- Treat Supabase RLS as part of application correctness; migration changes should preserve user ownership boundaries.
- Use Tailwind and existing CSS variables from `src/app/globals.css` for styling.

## Product Expectations

- Users must be signed in to generate and save summaries.
- The app should fail gracefully when Supabase or Anthropic environment variables are missing.
- Uploads are limited to PDF, DOCX, and TXT files and should respect the V1 size limit.
- Summary input limits and normalization should stay consistent between client and server validation.
- History pages should only expose summaries owned by the authenticated user.

## Testing And Verification

- Add or update Vitest coverage for shared utilities, validation rules, prompt construction, and other pure logic.
- For API route changes, test the relevant happy path and failure path manually if automated coverage is not practical.
- Run `npm.cmd run test` after changing shared logic.
- Run `npm.cmd run lint` after TypeScript, React, or route changes.
- Run `npm.cmd run build` before considering broad app or configuration changes done.

## Database And Supabase Notes

- Apply migrations from `supabase/migrations/` through Supabase tooling after linking a project.
- Keep generated or hand-maintained database types in `src/lib/database.types.ts` aligned with schema changes.
- Do not commit real Supabase keys, service role keys, Anthropic keys, or local `.env.local` files.
- The configured storage bucket should match `SUPABASE_STORAGE_BUCKET` and remain private unless the product requirements change.

## Agent Workflow

- Inspect relevant files before editing; this repo is small enough that context is cheap.
- Avoid unrelated refactors and formatting churn.
- Do not revert user changes unless explicitly asked.
- Prefer `rg` for searching.
- Use `apply_patch` for manual file edits.
- When a change touches user-facing behavior, verify it in the browser or with a build where practical.
