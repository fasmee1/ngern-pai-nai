// Pure helpers for savings goals and monthly bills.

import { isIsoDate } from "./input.ts";

export type Goal = { id: string; name: string; targetSatang: number; savedSatang: number; deadline: string | null };
export type Bill = {
  id: string;
  name: string;
  amountSatang: number;
  categoryId: string | null;
  accountId: string | null;
  dueDay: number;
  lastPaidMonth: string | null;
};

// Day of the month a bill is due. Limited to 1-28 so every month has it.
export function parseDueDay(text: string): number | null {
  if (!/^\d{1,2}$/.test(text.trim())) return null;
  const n = Number(text);
  return n >= 1 && n <= 28 ? n : null;
}

// A goal date must be a real date that is not in the past.
export function parseDeadline(text: string, today: string): string | null {
  const t = text.trim();
  if (!isIsoDate(t, "9999-12-30") || t < today) return null;
  return t;
}

export function goalPercent(saved: number, target: number): number {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.floor((saved / target) * 100)));
}

// How much to put aside each month to reach the goal by the deadline (satang). Null when there is no deadline or it is done.
export function monthlyNeeded(goal: Goal, today: string): number | null {
  const left = goal.targetSatang - goal.savedSatang;
  if (!goal.deadline || left <= 0) return null;
  const months = Math.max(
    1,
    (Number(goal.deadline.slice(0, 4)) - Number(today.slice(0, 4))) * 12 + Number(goal.deadline.slice(5, 7)) - Number(today.slice(5, 7)),
  );
  return Math.ceil(left / months);
}

export type BillState = { kind: "paid" } | { kind: "due"; lateDays: number } | { kind: "soon"; inDays: number };

// Paid this month, due now (today is on or after the due day), or coming up later this month.
export function billState(bill: Bill, today: string): BillState {
  const month = `${today.slice(0, 7)}-01`;
  if (bill.lastPaidMonth === month) return { kind: "paid" };
  const day = Number(today.slice(8, 10));
  return day >= bill.dueDay ? { kind: "due", lateDays: day - bill.dueDay } : { kind: "soon", inDays: bill.dueDay - day };
}
