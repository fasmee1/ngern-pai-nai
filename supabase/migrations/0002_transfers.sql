-- เงินไปไหน: moving money between a person's own accounts.
-- A transfer is not income or spending, so it lives in its own table and never changes the monthly totals.

create table if not exists public.transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  from_account_id uuid not null references public.accounts (id) on delete cascade,
  to_account_id uuid not null references public.accounts (id) on delete cascade,
  amount_satang bigint not null check (amount_satang > 0 and amount_satang <= 100000000000),
  occurred_on date not null,
  note text not null default '' check (char_length(note) <= 200),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  check (from_account_id <> to_account_id)
);

create index if not exists transfers_user_date_idx on public.transfers (user_id, occurred_on) where deleted_at is null;

alter table public.transfers enable row level security;

drop policy if exists "own transfers" on public.transfers;
create policy "own transfers" on public.transfers
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on public.transfers from anon;

-- Balance per account: income - spending +/- transfers. A null account_id means rows with no account.
create or replace function public.account_balances()
returns table (account_id uuid, balance_satang bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select t.account_id, sum(t.delta)::bigint as balance_satang
  from (
    select account_id, case when type = 'income' then amount_satang else -amount_satang end as delta
      from public.transactions where deleted_at is null and user_id = auth.uid()
    union all
    select from_account_id, -amount_satang from public.transfers where deleted_at is null and user_id = auth.uid()
    union all
    select to_account_id, amount_satang from public.transfers where deleted_at is null and user_id = auth.uid()
  ) t
  group by t.account_id;
$$;

revoke all on function public.account_balances() from public;
revoke execute on function public.account_balances() from anon;
grant execute on function public.account_balances() to authenticated;
