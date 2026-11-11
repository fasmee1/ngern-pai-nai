"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseAvatarColor, parseBaht, parseCategoryName, parseDisplayName, parseId, parseMonth, parseTransactionForm, parseTransferForm } from "@/lib/input";
import { monthStart, todayInBangkok } from "@/lib/dates";
import { parseDeadline, parseDueDay } from "@/lib/plans";
import { BANKS, parseBankCodes } from "@/lib/banks";
import { MAX_SPEAK_CHARS } from "@/lib/ai-prompt";
import { askGeminiJson, speakGemini } from "@/lib/gemini";
import { takeAiUse } from "@/lib/ai-limit";
import { buildEntryPrompt, MAX_ENTRY_CHARS, parseEntry, type QuickEntry } from "@/lib/quick-entry";

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


// Reads a short reply aloud with Gemini's voice. Only signed-in people can use it, and only short text is accepted.
export async function speakAnswer(text: string): Promise<{ ok: true; mime: string; base64: string } | { ok: false; error: string }> {
  const supabase = await signedInClient();
  if (!supabase) return { ok: false, error: "ยังไม่ได้เข้าระบบ ลองเข้าใหม่นะ" };
  const clean = typeof text === "string" ? text.trim().slice(0, MAX_SPEAK_CHARS) : "";
  if (!clean) return { ok: false, error: "ไม่มีข้อความให้อ่าน" };
  const use = await takeAiUse(supabase);
  if (!use.ok) return use;
  return speakGemini(clean);
}

const ENTRY_SCHEMA = {
  type: "OBJECT",
  properties: {
    type: { type: "STRING", enum: ["expense", "income"] },
    amount: { type: "NUMBER" },
    categoryName: { type: "STRING", nullable: true },
    note: { type: "STRING" },
    date: { type: "STRING", nullable: true },
  },
  required: ["type", "amount", "categoryName", "note", "date"],
};

// Turns a typed sentence into suggested form fields. Nothing is saved here; the person checks and saves.
export async function parseEntryText(text: string): Promise<{ ok: true; entry: QuickEntry } | { ok: false; error: string }> {
  const supabase = await signedInClient();
  if (!supabase) return { ok: false, error: "ยังไม่ได้เข้าระบบ ลองเข้าใหม่นะ" };
  const clean = typeof text === "string" ? text.trim().slice(0, MAX_ENTRY_CHARS) : "";
  if (!clean) return { ok: false, error: "พิมพ์รายการก่อนนะ เช่น กินข้าว 60" };

  const use = await takeAiUse(supabase);
  if (!use.ok) return use;

  const { data } = await supabase.from("categories").select("id, name, type").order("created_at");
  const categories = (data ?? []).map((c) => ({ id: c.id, name: c.name, type: c.type as "income" | "expense" }));
  const today = todayInBangkok();

  const raw = await askGeminiJson(buildEntryPrompt(today, categories), clean, ENTRY_SCHEMA);
  if (!raw) return { ok: false, error: "AI ตอบไม่ได้ตอนนี้ ลองอีกครั้งหรือกรอกเองนะ" };
  const entry = parseEntry(raw, categories, today);
  if (!entry) return { ok: false, error: "AI อ่านจำนวนเงินไม่ออก ลองพิมพ์ใหม่ เช่น กินข้าว 60" };
  return { ok: true, entry };
}

// Savings goals. The saved amount is money the person sets aside by hand; nothing moves between accounts.
export async function addGoal(name: string, targetText: string, deadline: string): Promise<Result> {
  const supabase = await signedInClient();
  if (!supabase) return NOT_SIGNED_IN;
  const cleanName = parseCategoryName(name);
  if (!cleanName) return { ok: false, error: "ตั้งชื่อเป้าหมายก่อนนะ (ไม่เกิน 40 ตัวอักษร)" };
  const target = parseBaht(targetText);
  if (target === null) return { ok: false, error: "ใส่เป้าหมายเป็นตัวเลข เช่น 50000" };
  let due: string | null = null;
  if (deadline.trim() !== "") {
    due = parseDeadline(deadline, todayInBangkok());
    if (!due) return { ok: false, error: "วันที่ครบกำหนดต้องไม่ใช่วันที่ผ่านมาแล้วนะ" };
  }
  const { error } = await supabase.from("savings_goals").insert({ name: cleanName, target_satang: target, deadline: due });
  if (error) return SAVE_FAILED;
  revalidatePath("/plans");
  return { ok: true };
}

export async function depositGoal(id: string, amountText: string): Promise<Result> {
  const supabase = await signedInClient();
  if (!supabase) return NOT_SIGNED_IN;
  const safeId = parseId(id);
  if (!safeId) return SAVE_FAILED;
  const amount = parseBaht(amountText);
  if (amount === null) return { ok: false, error: "ใส่จำนวนเงินเป็นตัวเลข เช่น 500" };

  const { data: goal, error: readError } = await supabase.from("savings_goals").select("saved_satang").eq("id", safeId).is("deleted_at", null).single();
  if (readError || !goal) return SAVE_FAILED;
  const next = Math.min(Number(goal.saved_satang) + amount, 100_000_000_000);
  const { error } = await supabase.from("savings_goals").update({ saved_satang: next }).eq("id", safeId);
  if (error) return SAVE_FAILED;
  revalidatePath("/plans");
  return { ok: true };
}

export async function deleteGoal(id: string): Promise<Result> {
  const supabase = await signedInClient();
  if (!supabase) return NOT_SIGNED_IN;
  const safeId = parseId(id);
  if (!safeId) return SAVE_FAILED;
  const { error } = await supabase.from("savings_goals").update({ deleted_at: new Date().toISOString() }).eq("id", safeId);
  if (error) return SAVE_FAILED;
  revalidatePath("/plans");
  return { ok: true };
}

// Monthly bills. A bill only reminds; paying one writes a normal expense for today.
export async function addBill(name: string, amountText: string, dueDay: string, categoryId: string, accountId: string): Promise<Result> {
  const supabase = await signedInClient();
  if (!supabase) return NOT_SIGNED_IN;
  const cleanName = parseCategoryName(name);
  if (!cleanName) return { ok: false, error: "ตั้งชื่อบิลก่อนนะ เช่น ค่าเน็ต" };
  const amount = parseBaht(amountText);
  if (amount === null) return { ok: false, error: "ใส่จำนวนเงินเป็นตัวเลข เช่น 599" };
  const day = parseDueDay(dueDay);
  if (day === null) return { ok: false, error: "วันที่ครบกำหนดต้องเป็น 1 ถึง 28" };
  const category = parseId(categoryId);
  if (!category) return { ok: false, error: "เลือกหมวดก่อนนะ" };
  const account = parseId(accountId);

  const { error } = await supabase
    .from("recurring_bills")
    .insert({ name: cleanName, amount_satang: amount, due_day: day, category_id: category, account_id: account });
  if (error) return SAVE_FAILED;
  revalidatePath("/plans");
  return { ok: true };
}

// Writes this month's expense for a bill and marks it paid for the month.
export async function payBill(id: string): Promise<Result> {
  const supabase = await signedInClient();
  if (!supabase) return NOT_SIGNED_IN;
  const safeId = parseId(id);
  if (!safeId) return SAVE_FAILED;

  const { data: bill } = await supabase
    .from("recurring_bills")
    .select("name, amount_satang, category_id, account_id")
    .eq("id", safeId)
    .is("deleted_at", null)
    .single();
  if (!bill) return SAVE_FAILED;

  const today = todayInBangkok();
  const month = monthStart(today);

  // Mark the month first, only if it is still unpaid, so a double tap cannot write two expenses.
  const { data: marked } = await supabase
    .from("recurring_bills")
    .update({ last_paid_month: month })
    .eq("id", safeId)
    .or(`last_paid_month.is.null,last_paid_month.neq.${month}`)
    .select("id");
  if (!marked || marked.length === 0) return { ok: false, error: "บิลนี้จดไปแล้วในเดือนนี้" };

  const { error } = await supabase.from("transactions").insert({
    type: "expense",
    amount_satang: bill.amount_satang,
    category_id: bill.category_id,
    account_id: bill.account_id,
    occurred_on: today,
    note: bill.name,
  });
  if (error) {
    await supabase.from("recurring_bills").update({ last_paid_month: null }).eq("id", safeId);
    return SAVE_FAILED;
  }
  revalidatePath("/");
  revalidatePath("/plans");
  return { ok: true };
}

export async function deleteBill(id: string): Promise<Result> {
  const supabase = await signedInClient();
  if (!supabase) return NOT_SIGNED_IN;
  const safeId = parseId(id);
  if (!safeId) return SAVE_FAILED;
  const { error } = await supabase.from("recurring_bills").update({ deleted_at: new Date().toISOString() }).eq("id", safeId);
  if (error) return SAVE_FAILED;
  revalidatePath("/plans");
  return { ok: true };
}
