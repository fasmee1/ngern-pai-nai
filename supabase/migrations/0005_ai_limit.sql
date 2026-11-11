-- เงินไปไหน: a daily cap on AI use per person, so a leaked login or a script cannot run up the Gemini bill.
-- The counter table cannot be read or written by the app directly; only take_ai_use() touches it.

create table if not exists public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  uses integer not null default 0,
  primary key (user_id, day)
);

alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon, authenticated;

-- Counts one use for the signed-in person today (Thailand time).
-- Returns true when the use is allowed, false when the daily limit is already reached.
create or replace function public.take_ai_use(max_per_day integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  today date := (now() at time zone 'Asia/Bangkok')::date;
  used integer;
begin
  if uid is null or max_per_day is null or max_per_day < 1 then
    return false;
  end if;
  insert into public.ai_usage (user_id, day, uses) values (uid, today, 1)
  on conflict (user_id, day) do update set uses = public.ai_usage.uses + 1
    where public.ai_usage.uses < max_per_day
  returning uses into used;
  return used is not null;
end;
$$;

revoke all on function public.take_ai_use(integer) from public, anon;
grant execute on function public.take_ai_use(integer) to authenticated;
