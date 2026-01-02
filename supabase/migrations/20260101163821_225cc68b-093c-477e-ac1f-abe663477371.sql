-- Create import logs table used by student-data-import
create table if not exists public.import_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  file_name text not null,
  file_type text not null,
  total_records integer not null default 0,
  successful_records integer not null default 0,
  failed_records integer not null default 0,
  errors jsonb not null default '[]'::jsonb,
  status text not null default 'processing',
  created_at timestamptz not null default now(),
  completed_at timestamptz null
);

create index if not exists import_logs_user_id_created_at_idx
  on public.import_logs (user_id, created_at desc);

alter table public.import_logs enable row level security;

drop policy if exists "Users can view their own import logs" on public.import_logs;
drop policy if exists "Users can create their own import logs" on public.import_logs;
drop policy if exists "Users can update their own import logs" on public.import_logs;
drop policy if exists "Users can delete their own import logs" on public.import_logs;

-- Users can view their own logs; admins can view all
create policy "Users can view their own import logs"
  on public.import_logs
  for select
  using (
    auth.uid() = user_id
    or public.has_role(auth.uid(), 'admin'::public.app_role)
  );

create policy "Users can create their own import logs"
  on public.import_logs
  for insert
  with check (
    auth.uid() = user_id
    or public.has_role(auth.uid(), 'admin'::public.app_role)
  );

create policy "Users can update their own import logs"
  on public.import_logs
  for update
  using (
    auth.uid() = user_id
    or public.has_role(auth.uid(), 'admin'::public.app_role)
  );

create policy "Users can delete their own import logs"
  on public.import_logs
  for delete
  using (
    auth.uid() = user_id
    or public.has_role(auth.uid(), 'admin'::public.app_role)
  );
