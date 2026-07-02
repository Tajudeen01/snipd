create extension if not exists "pgcrypto";

create table if not exists public.summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null check (source_type in ('text', 'document')),
  source_title text,
  file_path text,
  tone text not null check (tone in ('default', 'playful', 'quirky', 'five_year_old', 'sarcastic')),
  input_excerpt text not null,
  summary text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists summaries_user_created_idx
  on public.summaries (user_id, created_at desc);

alter table public.summaries enable row level security;

grant select, insert, delete on public.summaries to authenticated;
grant all on public.summaries to service_role;

drop policy if exists "Users can read their own summaries" on public.summaries;
create policy "Users can read their own summaries"
  on public.summaries
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own summaries" on public.summaries;
create policy "Users can insert their own summaries"
  on public.summaries
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own summaries" on public.summaries;
create policy "Users can delete their own summaries"
  on public.summaries
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_summaries_updated_at on public.summaries;
create trigger set_summaries_updated_at
  before update on public.summaries
  for each row
  execute function public.set_updated_at();

-- Storage setup guidance:
-- 1. Create a private bucket whose name matches SUPABASE_STORAGE_BUCKET.
-- 2. If uploads should use user-scoped Storage RLS instead of the server service role,
--    create policies on storage.objects for authenticated users where:
--      bucket_id = '<bucket-name>'
--      and (storage.foldername(name))[1] = 'uploads'
--      and (storage.foldername(name))[2] = (select auth.uid())::text
-- 3. For upserts, Supabase Storage requires INSERT, SELECT, and UPDATE policies.
