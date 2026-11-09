-- เงินไปไหน: tables and row-level security.
-- Money is stored in satang (bigint) so totals stay exact.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) <= 40),
  avatar_color text not null default '#918df6' check (avatar_color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now()
);

-- For databases created before the profile picture color existed.
alter table public.profiles add column if not exists avatar_color text not null default '#918df6';

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  type text not null check (type in ('income', 'expense')),
  color text not null check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  account_id uuid references public.accounts (id) on delete set null,
  category_id uuid references public.categories (id) on delete set null,
  type text not null check (type in ('income', 'expense')),
  amount_satang bigint not null check (amount_satang > 0 and amount_satang <= 100000000000),
  occurred_on date not null,
  note text not null default '' check (char_length(note) <= 200),
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  month date not null,
  amount_satang bigint not null check (amount_satang >= 0),
  unique (user_id, category_id, month)
);

create index if not exists transactions_user_month_idx on public.transactions (user_id, occurred_on) where deleted_at is null;

-- Profile row on sign-up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Starter accounts and categories for a new user. Safe to call more than once.
create or replace function public.seed_default_categories()
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if exists (select 1 from public.categories where user_id = auth.uid()) then
    return;
  end if;
  insert into public.accounts (name) values ('เงินสด'), ('พร้อมเพย์'), ('ธนาคาร');
  insert into public.categories (name, type, color) values
    ('ค่าอาหาร', 'expense', '#918df6'),
    ('ค่าเดินทาง', 'expense', '#2c78fc'),
    ('ค่าที่พัก', 'expense', '#33c758'),
    ('อื่น ๆ', 'expense', '#ffa600'),
    ('เงินเดือน', 'income', '#1f6f5c');
end;
$$;

-- Lets a user delete their own account and all data. Runs as the owner so it can reach auth.users.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
revoke all on function public.seed_default_categories() from public;
grant execute on function public.seed_default_categories() to authenticated;

-- Supabase also grants new functions to the anon role by default, so remove it explicitly.
revoke execute on function public.delete_my_account() from anon;
revoke execute on function public.seed_default_categories() from anon;

-- Row-level security: each person sees only their own rows.
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;

create policy "own profile" on public.profiles
  for all to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "own accounts" on public.accounts
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own categories" on public.categories
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own transactions" on public.transactions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own budgets" on public.budgets
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Keep the anon role out of the data tables.
revoke all on public.profiles, public.accounts, public.categories, public.transactions, public.budgets from anon;
