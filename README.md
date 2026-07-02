# Snipd

Snipd is a TL;DR summarizer web app scaffolded with Next.js 14, TypeScript, Tailwind CSS, Supabase, and Anthropic Claude.

## Getting Started

Copy `.env.example` to `.env.local` and fill in the Supabase and Anthropic values.

```bash
npm.cmd install
npm.cmd run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase

Apply the migration in `supabase/migrations` after linking a Supabase project. Create a private Storage bucket matching `SUPABASE_STORAGE_BUCKET`.

The `summaries` table has RLS enabled and authenticated ownership policies for select, insert, and delete.

## Scripts

```bash
npm.cmd run lint
npm.cmd run test
npm.cmd run build
```

## V1 Scope

The scaffold includes paste summarization, document upload route wiring, tone selection, auth screens, saved history views, API route handlers, document extraction services, prompt construction, and database migration. Real generation requires valid Anthropic and Supabase environment variables.
