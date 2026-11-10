"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseAvatarColor, parseBaht, parseCategoryName, parseDisplayName, parseId, parseMonth, parseTransactionForm, parseTransferForm } from "@/lib/input";
import { todayInBangkok } from "@/lib/dates";
import { BANKS, parseBankCodes } from "@/lib/banks";

type Result = { ok: true } | { ok: false; error: string };

const NOT_SIGNED_IN: Result = { ok: false, error: "ยังไม่ได้เข้าระบบ ลองเข้าใหม่นะ" };
const SAVE_FAILED: Result = { ok: false, error: "บันทึกไม่สำเร็จ ลองอีกครั้งนะ" };

async function signedInClient() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user ? supabase : null;
}

// Creates starter accounts and categories once per person.
export async function ensureSetup(): Promise<void> {
  const supabase = await signedInClient();
  if (!supabase) return;
  await supabase.rpc("seed_default_categories");
}

export async function saveTransaction(_prev: Result | null, form: FormData): Promise<Result> {
  const supabase = await signedInClient();
  if (!supabase) return NOT_SIGNED_IN;

  const parsed = parseTransactionForm(form, todayInBangkok());
  if (!parsed.ok) return parsed;

  const row = {
    type: parsed.value.type,
    amount_satang: parsed.value.amountSatang,
    category_id: parsed.value.categoryId,
    account_id: parsed.value.accountId,
    occurred_on: parsed.value.occurredOn,
    note: parsed.value.note,
  };

  const editId = parseId(form.get("id"));
  const { error } = editId
    ? await supabase.from("transactions").update(row).eq("id", editId)
    : await supabase.from("transactions").insert(row);

  if (error) return SAVE_FAILED;
  revalidatePath("/");
  return { ok: true };
}

// Adds the chosen banks as accounts (banks already added are skipped) and marks setup as done.
// An empty list is fine: it means "skip for now".
export async function saveBanks(codes: string[]): Promise<Result> {
  const supabase = await signedInClient();
  if (!supabase) return NOT_SIGNED_IN;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NOT_SIGNED_IN;

  const wanted = parseBankCodes(codes);
  const { data: existing, error: readError } = await supabase.from("accounts").select("bank_code");
  if (readError) return SAVE_FAILED;
  const have = new Set((existing ?? []).map((a) => a.bank_code));

  const rows = wanted
    .filter((code) => !have.has(code))
    .map((code) => ({ name: BANKS.find((b) => b.code === code)!.name, bank_code: code }));
  if (rows.length > 0) {
    const { error } = await supabase.from("accounts").insert(rows);
    if (error) return SAVE_FAILED;
  }

  const { error: flagError } = await supabase.from("profiles").update({ accounts_setup: true }).eq("id", auth.user.id);
  if (flagError) return SAVE_FAILED;

  revalidatePath("/", "layout");
  return { ok: true };
}

// Moves money between two of the person's own accounts. Totals for the month do not change.
export async function saveTransfer(_prev: Result | null, form: FormData): Promise<Result> {
  const supabase = await signedInClient();
  if (!supabase) return NOT_SIGNED_IN;

  const parsed = parseTransferForm(form, todayInBangkok());
  if (!parsed.ok) return parsed;

  const { error } = await supabase.from("transfers").insert({
    from_account_id: parsed.value.fromAccountId,
    to_account_id: parsed.value.toAccountId,
    amount_satang: parsed.value.amountSatang,
    occurred_on: parsed.value.occurredOn,
    note: parsed.value.note,
  });
  if (error) return SAVE_FAILED;
  revalidatePath("/wallets");
  return { ok: true };
}

export async function deleteTransfer(id: string): Promise<Result> {
  const supabase = await signedInClient();
  if (!supabase) return NOT_SIGNED_IN;
  const safeId = parseId(id);
  if (!safeId) return SAVE_FAILED;

  const { error } = await supabase.from("transfers").update({ deleted_at: new Date().toISOString() }).eq("id", safeId);
  if (error) return SAVE_FAILED;
  revalidatePath("/wallets");
  return { ok: true };
}

const CATEGORY_COLORS = ["#918df6", "#2c78fc", "#33c758", "#ffa600", "#1f6f5c", "#c2563a"];

// Adds a category for the person. The color rotates so new categories look different.
export async function addCategory(name: string, type: "income" | "expense"): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = await signedInClient();
  if (!supabase) return { ok: false, error: "ยังไม่ได้เข้าระบบ ลองเข้าใหม่นะ" };

  const cleanName = parseCategoryName(name);
  if (!cleanName) return { ok: false, error: "ตั้งชื่อหมวดก่อนนะ (ไม่เกิน 40 ตัวอักษร)" };
  if (type !== "income" && type !== "expense") return { ok: false, error: "บันทึกไม่สำเร็จ ลองอีกครั้งนะ" };

  const { count } = await supabase.from("categories").select("id", { count: "exact", head: true });
  const color = CATEGORY_COLORS[(count ?? 0) % CATEGORY_COLORS.length];

  const { data, error } = await supabase
    .from("categories")
    .insert({ name: cleanName, type, color })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "เพิ่มหมวดไม่สำเร็จ ลองอีกครั้งนะ" };

  revalidatePath("/");
  return { ok: true, id: data.id };
}

// Soft delete: the row stays so the person can undo right away.
export async function deleteTransaction(id: string): Promise<Result> {
  const supabase = await signedInClient();
  if (!supabase) return NOT_SIGNED_IN;
  const safeId = parseId(id);
  if (!safeId) return SAVE_FAILED;

  const { error } = await supabase
    .from("transactions")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", safeId);
  if (error) return SAVE_FAILED;
  revalidatePath("/");
  return { ok: true };
}

export async function restoreTransaction(id: string): Promise<Result> {
  const supabase = await signedInClient();
  if (!supabase) return NOT_SIGNED_IN;
  const safeId = parseId(id);
  if (!safeId) return SAVE_FAILED;

  const { error } = await supabase.from("transactions").update({ deleted_at: null }).eq("id", safeId);
  if (error) return SAVE_FAILED;
  revalidatePath("/");
  return { ok: true };
}

// Empty text clears the budget for that category.
export async function saveBudget(categoryId: string, month: string, amountText: string): Promise<Result> {
  const supabase = await signedInClient();
  if (!supabase) return NOT_SIGNED_IN;

  const safeCategory = parseId(categoryId);
  const safeMonth = parseMonth(month);
  if (!safeCategory || !safeMonth) return SAVE_FAILED;

  if (amountText.trim() === "") {
    const { error } = await supabase.from("budgets").delete().eq("category_id", safeCategory).eq("month", safeMonth);
    if (error) return SAVE_FAILED;
  } else {
    const satang = parseBaht(amountText);
    if (satang === null) return { ok: false, error: "ใส่งบเป็นตัวเลข เช่น 3000" };
    const { error } = await supabase.from("budgets").upsert(
      { category_id: safeCategory, month: safeMonth, amount_satang: satang },
      { onConflict: "user_id,category_id,month" },
    );
    if (error) return SAVE_FAILED;
  }

  revalidatePath("/");
  return { ok: true };
}

// Changes the name and picture color shown in the app.
export async function saveProfile(displayName: string, avatarColor: string): Promise<Result> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NOT_SIGNED_IN;

  const name = parseDisplayName(displayName);
  if (!name) return { ok: false, error: "ใส่ชื่อก่อนนะ (ไม่เกิน 40 ตัวอักษร)" };
  const color = parseAvatarColor(avatarColor);
  if (!color) return SAVE_FAILED;

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: data.user.id, display_name: name, avatar_color: color }, { onConflict: "id" });
  if (error) return SAVE_FAILED;

  revalidatePath("/", "layout");
  return { ok: true };
}

// Removes the account and all its data, then signs out.
export async function deleteMyAccount(confirmText: string): Promise<Result> {
  if (confirmText.trim() !== "ลบ") return { ok: false, error: "พิมพ์คำว่า ลบ ให้ตรงก่อนนะ" };
  const supabase = await signedInClient();
  if (!supabase) return NOT_SIGNED_IN;

  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { ok: false, error: "ลบบัญชีไม่สำเร็จ ลองอีกครั้งหรือติดต่อผู้ดูแล" };

  await supabase.auth.signOut();
  redirect("/");
}

