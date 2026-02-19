-- Run this in your Supabase SQL Editor

-- Create bookmarks table
create table if not exists public.bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  url text not null,
  title text not null,
  created_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table public.bookmarks enable row level security;

-- Policy: Users can only see their own bookmarks
create policy "Users can view own bookmarks"
  on public.bookmarks
  for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own bookmarks
create policy "Users can insert own bookmarks"
  on public.bookmarks
  for insert
  with check (auth.uid() = user_id);

-- Policy: Users can delete their own bookmarks
create policy "Users can delete own bookmarks"
  on public.bookmarks
  for delete
  using (auth.uid() = user_id);

-- Enable realtime for bookmarks table
alter publication supabase_realtime add table public.bookmarks;
