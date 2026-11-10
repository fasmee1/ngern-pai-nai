-- เงินไปไหน: savings goals and monthly bills.
-- A goal tracks money set aside by hand. A bill is a reminder; paying it creates a normal transaction.

create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  target_satang bigint not null check (target_satang > 0 and target_satang <= 100000000000),
  saved_satang bigint not null default 0 check (saved_satang >= 0 and saved_satang <= 100000000000),
  deadline date,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.recurring_bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  amount_satang bigint not null check (amount_satang > 0 and amount_satang <= 100000000000),
  category_id uuid references public.categories (id) on delete set null,
  account_id uuid references public.accounts (id) on delete set null,
  due_day smallint not null check (due_day between 1 and 28),
  last_paid_month date,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.savings_goals enable row level security;
alter table public.recurring_bills enable row level security;

drop policy if exists "own goals" on public.savings_goals;
create policy "own goals" on public.savings_goals
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own bills" on public.recurring_bills;
create policy "own bills" on public.recurring_bills
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on public.savings_goals from anon;
revoke all on public.recurring_bills from anon;
