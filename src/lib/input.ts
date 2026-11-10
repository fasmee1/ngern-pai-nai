// Pure checks for what people type. Shared by the form and the server actions.

export const MAX_SATANG = 100_000_000_000; // 1,000,000,000 baht
export const MAX_NOTE = 200;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// "250" -> 25000, "12.5" -> 1250, "1,200.75" -> 120075. Returns null when invalid.
export function parseBaht(text: string): number | null {
  const cleaned = text.trim().replace(/,/g, "");
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, frac = ""] = cleaned.split(".");
  const satang = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
  if (!Number.isSafeInteger(satang) || satang <= 0 || satang > MAX_SATANG) return null;
  return satang;
}

export function isIsoDate(text: string, today: string): boolean {
  if (!ISO_DATE.test(text)) return false;
  const parsed = new Date(`${text}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== text) return false;
  // No future dates beyond tomorrow, to catch typos like 2062.
  const limit = new Date(`${today}T00:00:00Z`);
  limit.setUTCDate(limit.getUTCDate() + 1);
  return parsed <= limit;
}

export type TransactionInput = {
  type: "income" | "expense";
  amountSatang: number;
  categoryId: string;
  accountId: string;
  occurredOn: string;
  note: string;
};

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

export function parseTransactionForm(form: FormData, today: string): ParseResult<TransactionInput> {
  const type = String(form.get("type") ?? "");
  if (type !== "income" && type !== "expense") return { ok: false, error: "เลือกรายรับหรือรายจ่ายก่อนนะ" };

  const amountSatang = parseBaht(String(form.get("amount") ?? ""));
  if (amountSatang === null) return { ok: false, error: "ใส่จำนวนเงินก่อนนะ เช่น 250" };

  const categoryId = String(form.get("categoryId") ?? "");
  if (!UUID.test(categoryId)) return { ok: false, error: "เลือกหมวดก่อนนะ" };

  const accountId = String(form.get("accountId") ?? "");
  if (!UUID.test(accountId)) return { ok: false, error: "เลือกบัญชีก่อนนะ" };

  const occurredOn = String(form.get("occurredOn") ?? "");
  if (!isIsoDate(occurredOn, today)) return { ok: false, error: "วันที่ไม่ถูกต้อง ลองเลือกใหม่นะ" };

  const note = String(form.get("note") ?? "").trim();
  if (note.length > MAX_NOTE) return { ok: false, error: `โน้ตยาวเกิน ${MAX_NOTE} ตัวอักษร` };

  return { ok: true, value: { type, amountSatang, categoryId, accountId, occurredOn, note } };
}

export type TransferInput = {
  fromAccountId: string;
  toAccountId: string;
  amountSatang: number;
  occurredOn: string;
  note: string;
};

export function parseTransferForm(form: FormData, today: string): ParseResult<TransferInput> {
  const fromAccountId = String(form.get("fromAccountId") ?? "");
  if (!UUID.test(fromAccountId)) return { ok: false, error: "เลือกบัญชีต้นทางก่อนนะ" };

  const toAccountId = String(form.get("toAccountId") ?? "");
  if (!UUID.test(toAccountId)) return { ok: false, error: "เลือกบัญชีปลายทางก่อนนะ" };
  if (fromAccountId === toAccountId) return { ok: false, error: "เลือกบัญชีต้นทางกับปลายทางคนละบัญชีนะ" };

  const amountSatang = parseBaht(String(form.get("amount") ?? ""));
  if (amountSatang === null) return { ok: false, error: "ใส่จำนวนเงินก่อนนะ เช่น 500" };

  const occurredOn = String(form.get("occurredOn") ?? "");
  if (!isIsoDate(occurredOn, today)) return { ok: false, error: "วันที่ไม่ถูกต้อง ลองเลือกใหม่นะ" };

  const note = String(form.get("note") ?? "").trim();
  if (note.length > MAX_NOTE) return { ok: false, error: `โน้ตยาวเกิน ${MAX_NOTE} ตัวอักษร` };

  return { ok: true, value: { fromAccountId, toAccountId, amountSatang, occurredOn, note } };
}

export function parseId(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "");
  return UUID.test(text) ? text : null;
}

export function parseMonth(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "");
  return /^\d{4}-\d{2}-01$/.test(text) ? text : null;
}

export function parseCategoryName(text: string): string | null {
  const name = text.trim().replace(/\s+/g, " ");
  return name.length >= 1 && name.length <= 40 ? name : null;
}

export const AVATAR_COLORS = ["#918df6", "#2c78fc", "#33c758", "#ffa600", "#d6409f", "#5fd0b8"] as const;

export function parseDisplayName(text: string): string | null {
  const name = text.trim().replace(/\s+/g, " ");
  return name.length >= 1 && name.length <= 40 ? name : null;
}

export function parseAvatarColor(text: string): string | null {
  return (AVATAR_COLORS as readonly string[]).includes(text) ? text : null;
}

// First visible character, for the round profile picture.
export function initialOf(name: string): string {
  const first = Array.from(name.trim())[0];
  return first ? first.toUpperCase() : "?";
}
