import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { monthEnd, monthStart, todayInBangkok } from "@/lib/dates";
import type { Category, Transaction } from "@/lib/summary";

export type Account = { id: string; name: string };

export type MonthData = {
  month: string;
  categories: (Category & { type: "income" | "expense" })[];
  accounts: Account[];
  transactions: (Transaction & { deletedAt: null })[];
  budgets: Record<string, number>;
};

// Loads one month for the signed-in person. Row-level security limits every query to their rows.
export async function loadMonth(): Promise<MonthData> {
  const supabase = await createSupabaseServerClient();
  const month = monthStart(todayInBangkok());
  const end = monthEnd(month);

  const [categories, accounts, transactions, budgets] = await Promise.all([
    supabase.from("categories").select("id, name, type, color").order("created_at"),
    supabase.from("accounts").select("id, name").order("created_at"),
    supabase
      .from("transactions")
      .select("id, type, category_id, account_id, amount_satang, occurred_on, note")
      .is("deleted_at", null)
      .gte("occurred_on", month)
      .lte("occurred_on", end)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("budgets").select("category_id, amount_satang").eq("month", month),
  ]);

  return {
    month,
    categories: (categories.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type as "income" | "expense",
      color: row.color,
    })),
    accounts: (accounts.data ?? []).map((row) => ({ id: row.id, name: row.name })),
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
  };
}

export type SignedInUser = { id: string; email: string | null; user_metadata: Record<string, unknown> };

// Who is signed in right now, or null. Reads the signed login token and checks it locally,
// so most requests need no extra trip to Supabase.
export async function currentUser(): Promise<SignedInUser | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub, email: claims.email ?? null, user_metadata: claims.user_metadata ?? {} };
}

export type Profile = { name: string; color: string; photo: string | null };

// Profile for the signed-in person. Falls back to the Google name, then the email.
export async function loadProfile(fallbackName: string, photo: string | null = null): Promise<Profile> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("profiles").select("display_name, avatar_color").maybeSingle();
  return {
    name: (data?.display_name ?? "").trim() || fallbackName,
    color: data?.avatar_color ?? "#918df6",
    photo,
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
