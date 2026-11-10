import "server-only";
import { connection } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { monthEnd, monthStart, monthsBefore, previousMonthStart, todayInBangkok } from "@/lib/dates";
import type { Category, Transaction } from "@/lib/summary";
import type { Bill, Goal } from "@/lib/plans";

export type Account = { id: string; name: string; bankCode?: string | null };

export type MonthData = {
  month: string;
  categories: (Category & { type: "income" | "expense" })[];
  accounts: Account[];
  transactions: (Transaction & { deletedAt: null })[];
  budgets: Record<string, number>;
  // Last month's spending per category (satang), for the comparison card.
  previous: { month: string; expenseByCategory: Record<string, number> };
};

// Loads one month for the signed-in person. Row-level security limits every query to their rows.
export async function loadMonth(): Promise<MonthData> {
  const supabase = await createSupabaseServerClient();
  const month = monthStart(todayInBangkok());
  const end = monthEnd(month);

  const before = previousMonthStart(month);

  const [categories, accounts, transactions, budgets, previous] = await Promise.all([
    supabase.from("categories").select("id, name, type, color").order("created_at"),
    supabase.from("accounts").select("id, name, bank_code").order("created_at"),
    supabase
      .from("transactions")
      .select("id, type, category_id, account_id, amount_satang, occurred_on, note")
      .is("deleted_at", null)
      .gte("occurred_on", month)
      .lte("occurred_on", end)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("budgets").select("category_id, amount_satang").eq("month", month),
    supabase
      .from("transactions")
      .select("category_id, amount_satang")
      .eq("type", "expense")
      .is("deleted_at", null)
      .gte("occurred_on", before)
      .lte("occurred_on", monthEnd(before)),
  ]);

  const expenseByCategory: Record<string, number> = {};
  for (const row of previous.data ?? []) {
    const id = row.category_id ?? "";
    expenseByCategory[id] = (expenseByCategory[id] ?? 0) + Number(row.amount_satang);
  }

  return {
    month,
    categories: (categories.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type as "income" | "expense",
      color: row.color,
    })),
    accounts: (accounts.data ?? []).map((row) => ({ id: row.id, name: row.name, bankCode: row.bank_code })),
    transactions: (transactions.data ?? []).map((row) => ({
      id: row.id,
      type: row.type as "income" | "expense",
      categoryId: row.category_id ?? "",
      accountId: row.account_id ?? "",
      amountSatang: Number(row.amount_satang),
      note: row.note,
      account: "",
      occurredOn: row.occurred_on,
      deletedAt: null,
    })),
    budgets: Object.fromEntries((budgets.data ?? []).map((row) => [row.category_id, Number(row.amount_satang)])),
    previous: { month: before, expenseByCategory },
  };
}

export type CompareData = {
  current: string;
  // Months that can be compared with, newest first.
  months: string[];
  categories: { id: string; name: string; color: string }[];
  // Expense per category (satang) for the current month and each month in `months`.
  byMonth: Record<string, Record<string, number>>;
};

// One query for the last 12 months of expenses, grouped by month here so picking a month is instant.
export async function loadCompareData(): Promise<CompareData> {
  const supabase = await createSupabaseServerClient();
  const current = monthStart(todayInBangkok());
  const months = monthsBefore(current, 12);
  const oldest = months[months.length - 1];

  const [categories, rows] = await Promise.all([
    supabase.from("categories").select("id, name, color").eq("type", "expense").order("created_at"),
    supabase
      .from("transactions")
      .select("category_id, amount_satang, occurred_on")
      .eq("type", "expense")
      .is("deleted_at", null)
      .gte("occurred_on", oldest)
      .lte("occurred_on", monthEnd(current)),
  ]);

  const byMonth: Record<string, Record<string, number>> = { [current]: {} };
  for (const m of months) byMonth[m] = {};
  for (const row of rows.data ?? []) {
    const bucket = byMonth[monthStart(row.occurred_on)];
    if (!bucket) continue;
    const id = row.category_id ?? "";
    bucket[id] = (bucket[id] ?? 0) + Number(row.amount_satang);
  }

  return {
    current,
    months,
    categories: (categories.data ?? []).map((c) => ({ id: c.id, name: c.name, color: c.color })),
    byMonth,
  };
}

export type WalletsData = {
  accounts: Account[];
  // Balance per account id (satang). The "" key holds rows that have no account.
  balances: Record<string, number>;
  transfers: { id: string; fromId: string; toId: string; amountSatang: number; occurredOn: string; note: string }[];
};

export async function loadWallets(): Promise<WalletsData> {
  const supabase = await createSupabaseServerClient();
  const [accounts, balances, transfers] = await Promise.all([
    supabase.from("accounts").select("id, name, bank_code").order("created_at"),
    supabase.rpc("account_balances"),
    supabase
      .from("transfers")
      .select("id, from_account_id, to_account_id, amount_satang, occurred_on, note")
      .is("deleted_at", null)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return {
    accounts: (accounts.data ?? []).map((a) => ({ id: a.id, name: a.name, bankCode: a.bank_code })),
    balances: Object.fromEntries((balances.data ?? []).map((b: { account_id: string | null; balance_satang: number | string }) => [b.account_id ?? "", Number(b.balance_satang)])),
    transfers: (transfers.data ?? []).map((t) => ({
      id: t.id,
      fromId: t.from_account_id,
      toId: t.to_account_id,
      amountSatang: Number(t.amount_satang),
      occurredOn: t.occurred_on,
      note: t.note,
    })),
  };
}

export type PlansData = {
  goals: Goal[];
  bills: Bill[];
  categories: { id: string; name: string; color: string }[];
  accounts: Account[];
};

export async function loadPlans(): Promise<PlansData> {
  const supabase = await createSupabaseServerClient();
  const [goals, bills, categories, accounts] = await Promise.all([
    supabase.from("savings_goals").select("id, name, target_satang, saved_satang, deadline").is("deleted_at", null).order("created_at"),
    supabase
      .from("recurring_bills")
      .select("id, name, amount_satang, category_id, account_id, due_day, last_paid_month")
      .is("deleted_at", null)
      .order("due_day"),
    supabase.from("categories").select("id, name, color").eq("type", "expense").order("created_at"),
    supabase.from("accounts").select("id, name, bank_code").order("created_at"),
  ]);
  return {
    goals: (goals.data ?? []).map((g) => ({
      id: g.id,
      name: g.name,
      targetSatang: Number(g.target_satang),
      savedSatang: Number(g.saved_satang),
      deadline: g.deadline,
    })),
    bills: (bills.data ?? []).map((b) => ({
      id: b.id,
      name: b.name,
      amountSatang: Number(b.amount_satang),
      categoryId: b.category_id,
      accountId: b.account_id,
      dueDay: b.due_day,
      lastPaidMonth: b.last_paid_month,
    })),
    categories: (categories.data ?? []).map((c) => ({ id: c.id, name: c.name, color: c.color })),
    accounts: (accounts.data ?? []).map((a) => ({ id: a.id, name: a.name, bankCode: a.bank_code })),
  };
}

export type SignedInUser = { id: string; email: string | null; user_metadata: Record<string, unknown> };

// Who is signed in right now, or null. Reads the signed login token and checks it locally,
// so most requests need no extra trip to Supabase.
export async function currentUser(): Promise<SignedInUser | null> {
  // Opts this render into request time before the token check reads the clock.
  await connection();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub, email: claims.email ?? null, user_metadata: claims.user_metadata ?? {} };
}

export type Profile = { name: string; color: string; photo: string | null; accountsSetup: boolean };

// Profile for the signed-in person. Falls back to the Google name, then the email.
export async function loadProfile(fallbackName: string, photo: string | null = null): Promise<Profile> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("profiles").select("display_name, avatar_color, accounts_setup").maybeSingle();
  return {
    name: (data?.display_name ?? "").trim() || fallbackName,
    color: data?.avatar_color ?? "#918df6",
    photo,
    // A missing row means a brand-new person, so they still need to pick banks.
    accountsSetup: data?.accounts_setup ?? false,
  };
}

// Profile picture from the Google account. Only https links are used.
export function googlePhoto(user: { user_metadata?: Record<string, unknown> }): string | null {
  const meta = user.user_metadata ?? {};
  const url = typeof meta.avatar_url === "string" ? meta.avatar_url : typeof meta.picture === "string" ? meta.picture : "";
  return url.startsWith("https://") ? url : null;
}

// Name from the Google account, or the part of the email before "@".
export function googleName(user: { email?: string | null; user_metadata?: Record<string, unknown> }): string {
  const meta = user.user_metadata ?? {};
  const full = typeof meta.full_name === "string" ? meta.full_name : typeof meta.name === "string" ? meta.name : "";
  return full.trim() || (user.email ?? "").split("@")[0] || "ผู้ใช้";
}
