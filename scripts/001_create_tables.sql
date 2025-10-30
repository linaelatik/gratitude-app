-- Create users table (extends auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamp with time zone default now()
);

alter table public.users enable row level security;

create policy "users_select_own"
  on public.users for select
  using (auth.uid() = id);

create policy "users_insert_own"
  on public.users for insert
  with check (auth.uid() = id);

create policy "users_update_own"
  on public.users for update
  using (auth.uid() = id);

-- Create gratitude entries table
create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.entries enable row level security;

create policy "entries_select_own"
  on public.entries for select
  using (auth.uid() = user_id);

create policy "entries_insert_own"
  on public.entries for insert
  with check (auth.uid() = user_id);

create policy "entries_update_own"
  on public.entries for update
  using (auth.uid() = user_id);

create policy "entries_delete_own"
  on public.entries for delete
  using (auth.uid() = user_id);

-- Create email subscriptions table
create table if not exists public.email_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  weekly_summary boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id)
);

alter table public.email_subscriptions enable row level security;

create policy "subscriptions_select_own"
  on public.email_subscriptions for select
  using (auth.uid() = user_id);

create policy "subscriptions_insert_own"
  on public.email_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "subscriptions_update_own"
  on public.email_subscriptions for update
  using (auth.uid() = user_id);

-- Create indexes for better performance
create index if not exists entries_user_id_idx on public.entries(user_id);
create index if not exists entries_created_at_idx on public.entries(created_at desc);
create index if not exists email_subscriptions_user_id_idx on public.email_subscriptions(user_id);

-- Create stress queries table for AI interactions
create table if not exists public.stress_queries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  stressor_text text not null,
  retrieved_entry_ids uuid[] not null,
  ai_response text not null,
  created_at timestamp with time zone default now()
);

alter table public.stress_queries enable row level security;

create policy "stress_queries_select_own"
  on public.stress_queries for select
  using (auth.uid() = user_id);

create policy "stress_queries_insert_own"
  on public.stress_queries for insert
  with check (auth.uid() = user_id);

-- Create index for stress queries
create index if not exists stress_queries_user_id_idx on public.stress_queries(user_id);
create index if not exists stress_queries_created_at_idx on public.stress_queries(created_at desc);