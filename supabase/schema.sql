-- ============================================================
-- StepBattle — Supabase schema
-- Paste this into the Supabase SQL editor and run it
-- ============================================================

-- Users (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.users
  add constraint username_format check (username ~ '^[a-z0-9_]{3,16}$');

-- Challenges
create table public.challenges (
  id uuid default gen_random_uuid() primary key,
  type text not null check (type in ('single_day', 'multi_day')),
  step_goal int not null default 10000,
  start_date date not null,
  end_date date not null,
  status text not null default 'pending' check (status in ('pending', 'active', 'completed')),
  invite_code text unique not null,
  created_by uuid references public.users(id),
  created_at timestamptz default now()
);

-- Challenge participants
create table public.challenge_participants (
  id uuid default gen_random_uuid() primary key,
  challenge_id uuid references public.challenges(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'active', 'forfeit')),
  joined_at timestamptz default now(),
  unique(challenge_id, user_id)
);

-- Daily logs — upserted on each sync
create table public.daily_logs (
  id uuid default gen_random_uuid() primary key,
  challenge_id uuid references public.challenges(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  log_date date not null,
  step_count int not null default 0,
  synced_at timestamptz default now(),
  unique(challenge_id, user_id, log_date)
);

-- Enable Realtime on daily_logs so opponent devices get live updates
alter publication supabase_realtime add table public.daily_logs;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.users enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_participants enable row level security;
alter table public.daily_logs enable row level security;

-- Users
create policy "Anyone can read users" on public.users for select using (true);
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

-- Challenges
create policy "Participants can read their challenges" on public.challenges for select
  using (exists (
    select 1 from public.challenge_participants
    where challenge_id = challenges.id and user_id = auth.uid()
  ));
create policy "Users can create challenges" on public.challenges for insert
  with check (auth.uid() = created_by);
create policy "Creator can update challenge" on public.challenges for update
  using (auth.uid() = created_by);

-- Challenge participants
create policy "Participants can read their challenge members" on public.challenge_participants for select
  using (exists (
    select 1 from public.challenge_participants cp
    where cp.challenge_id = challenge_participants.challenge_id and cp.user_id = auth.uid()
  ));
create policy "Users can join challenges" on public.challenge_participants for insert
  with check (auth.uid() = user_id);

-- Daily logs
create policy "Participants can read logs in their challenges" on public.daily_logs for select
  using (exists (
    select 1 from public.challenge_participants
    where challenge_id = daily_logs.challenge_id and user_id = auth.uid()
  ));
create policy "Users can insert own logs" on public.daily_logs for insert
  with check (auth.uid() = user_id);
create policy "Users can update own logs" on public.daily_logs for update
  using (auth.uid() = user_id);

-- ============================================================
-- Helper function: join challenge by invite code
-- ============================================================
create or replace function join_challenge_by_code(p_invite_code text)
returns uuid
language plpgsql security definer as $$
declare
  v_challenge_id uuid;
begin
  select id into v_challenge_id
  from public.challenges
  where invite_code = lower(trim(p_invite_code))
    and status = 'active';

  if v_challenge_id is null then
    raise exception 'Challenge not found or not active';
  end if;

  insert into public.challenge_participants (challenge_id, user_id, status)
  values (v_challenge_id, auth.uid(), 'active')
  on conflict (challenge_id, user_id) do nothing;

  return v_challenge_id;
end;
$$;
