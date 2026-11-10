-- เงินไปไหน: pick bank accounts.
-- An account can remember which bank it is, and a person is asked once which banks they use.

alter table public.accounts add column if not exists bank_code text check (bank_code is null or char_length(bank_code) <= 20);
create unique index if not exists accounts_user_bank_idx on public.accounts (user_id, bank_code) where bank_code is not null;

-- false until the person has chosen their banks (or skipped). Everyone who already exists is done.
alter table public.profiles add column if not exists accounts_setup boolean not null default false;
update public.profiles set accounts_setup = true where accounts_setup = false;

-- New people start with only cash; they pick their banks on first sign-in.
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
  insert into public.accounts (name) values ('เงินสด');
  insert into public.categories (name, type, color) values
    ('ค่าอาหาร', 'expense', '#918df6'),
    ('ค่าเดินทาง', 'expense', '#2c78fc'),
    ('ค่าที่พัก', 'expense', '#33c758'),
    ('อื่น ๆ', 'expense', '#ffa600'),
    ('เงินเดือน', 'income', '#1f6f5c');
end;
$$;
