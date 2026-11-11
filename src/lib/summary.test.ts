import assert from "node:assert/strict";
import test from "node:test";
import { buildComparison, buildSummary, formatBaht, type Category, type Transaction } from "./summary.ts";

const categories: Category[] = [
  { id: "food", name: "ค่าอาหาร", color: "#918df6", budgetSatang: 10_000 },
  { id: "travel", name: "ค่าเดินทาง", color: "#2c78fc", budgetSatang: 50_000 },
];

const item = (
  id: string,
  type: Transaction["type"],
  categoryId: string,
  amountSatang: number,
): Transaction => ({
  id,
  type,
  categoryId,
  amountSatang,
  note: "",
  account: "เงินสด",
  occurredOn: "2026-11-01",
});

test("adds income, expense and balance exactly", () => {
  const result = buildSummary(categories, [
    item("1", "income", "salary", 100_000),
    item("2", "expense", "food", 10),
    item("3", "expense", "food", 20),
  ]);
  assert.equal(result.incomeSatang, 100_000);
  assert.equal(result.expenseSatang, 30);
  assert.equal(result.balanceSatang, 99_970);
});

test("names the biggest category in the headline", () => {
  const result = buildSummary(categories, [
    item("1", "expense", "food", 1_000),
    item("2", "expense", "travel", 3_000),
  ]);
  assert.equal(result.headline, "เดือนนี้ใช้ค่าเดินทางเยอะสุด");
  assert.equal(result.slices[0].share, 0.75);
});

test("reports only categories over budget", () => {
  const result = buildSummary(categories, [
    item("1", "expense", "food", 12_000),
    item("2", "expense", "travel", 50_000),
  ]);
  assert.deepEqual(result.overBudget, [{ name: "ค่าอาหาร", overSatang: 2_000 }]);
});

test("handles a month with no spending", () => {
  const result = buildSummary(categories, []);
  assert.equal(result.headline, "ยังไม่มีรายจ่ายเดือนนี้");
  assert.deepEqual(result.slices, []);
});

test("formats baht for display", () => {
  assert.equal(formatBaht(1_240_000), "12,400");
  assert.equal(formatBaht(1_250), "12.50");
});

test("compares this month with last month per category", () => {
  const result = buildComparison(categories, { food: 30_000, travel: 5_000 }, { food: 20_000, travel: 10_000 });
  assert.equal(result.diffSatang, 5_000);
  assert.equal(result.percent, 17);
  assert.equal(result.rows[0].id, "food");
  assert.match(result.headline, /มากกว่า/);
});

test("says there is nothing to compare when last month is empty", () => {
  const result = buildComparison(categories, { food: 100 }, {});
  assert.equal(result.hasBefore, false);
  assert.equal(result.percent, null);
});

import { frequentEntries, todayAllowance } from "./summary.ts";

test("today's allowance drops as today's spending is written down", () => {
  // 2,000 baht left over 20 days is 100 baht a day.
  assert.deepEqual(todayAllowance(200000, 0, 20), { budgetSatang: 10000, spentSatang: 0, leftSatang: 10000 });
  // Spend 30 baht today: the balance falls to 1,970 but the day's budget stays 100.
  assert.deepEqual(todayAllowance(197000, 3000, 20), { budgetSatang: 10000, spentSatang: 3000, leftSatang: 7000 });
  // Spend 130 baht: over today's budget, so left is negative.
  assert.equal(todayAllowance(187000, 13000, 20)?.leftSatang, -3000);
  assert.equal(todayAllowance(0, 0, 20), null);
  assert.equal(todayAllowance(1000, 0, 0), null);
});

test("frequent entries need two repeats and keep the newest amount", () => {
  const tx = (id: string, note: string, amount: number, type: "income" | "expense" = "expense") => ({
    id, type, categoryId: "c1", accountId: "a1", amountSatang: amount, note, account: "", occurredOn: "2026-11-01",
  });
  const out = frequentEntries([tx("1", "กาแฟ", 5500), tx("2", "กาแฟ", 4500), tx("3", "ข้าว", 6000), tx("4", "เงินเดือน", 100, "income"), tx("5", "เงินเดือน", 100, "income")]);
  assert.equal(out.length, 1);
  assert.equal(out[0].note, "กาแฟ");
  assert.equal(out[0].amountSatang, 5500);
  assert.equal(out[0].count, 2);
});

import { nextMonthStart, parseMonthParam } from "./dates.ts";

test("month parameter falls back to this month unless it is a real past month", () => {
  const today = "2026-11-11";
  assert.equal(parseMonthParam("2026-10", today), "2026-10-01");
  assert.equal(parseMonthParam("2026-11", today), "2026-11-01");
  assert.equal(parseMonthParam("2026-12", today), "2026-11-01");
  assert.equal(parseMonthParam("2026-13", today), "2026-11-01");
  assert.equal(parseMonthParam("abc", today), "2026-11-01");
  assert.equal(parseMonthParam(undefined, today), "2026-11-01");
  assert.equal(parseMonthParam("2019-12", today), "2026-11-01");
  assert.equal(nextMonthStart("2026-12-01"), "2027-01-01");
  assert.equal(nextMonthStart("2026-10-01"), "2026-11-01");
});

import { budgetTotals, filterTransactions } from "./summary.ts";

test("list filter matches note or category name, type, and category", () => {
  const cats = [{ id: "c1", name: "อาหาร", color: "#000" }, { id: "c2", name: "เดินทาง", color: "#111" }];
  const t = (id: string, categoryId: string, note: string, type: "expense" | "income" = "expense") => ({
    id, type, categoryId, accountId: "a", amountSatang: 100, note, account: "", occurredOn: "2026-11-01",
  });
  const rows = [t("1", "c1", "กาแฟ ร้านหน้าปากซอย"), t("2", "c2", "แท็กซี่"), t("3", "c1", "เงินพิเศษ", "income")];
  const base = { query: "", type: "all" as const, categoryId: null };
  assert.equal(filterTransactions(rows, cats, base).length, 3);
  assert.deepEqual(filterTransactions(rows, cats, { ...base, query: "กาแฟ" }).map((r) => r.id), ["1"]);
  assert.deepEqual(filterTransactions(rows, cats, { ...base, query: "เดินทาง" }).map((r) => r.id), ["2"]);
  assert.deepEqual(filterTransactions(rows, cats, { ...base, query: "กาแฟ ซอย" }).map((r) => r.id), ["1"]);
  assert.deepEqual(filterTransactions(rows, cats, { ...base, type: "income" }).map((r) => r.id), ["3"]);
  assert.deepEqual(filterTransactions(rows, cats, { ...base, categoryId: "c2" }).map((r) => r.id), ["2"]);
});

test("budget totals only count categories that have a budget", () => {
  const cats = [{ id: "c1", name: "อาหาร", color: "#000", budgetSatang: 100000 }, { id: "c2", name: "อื่น ๆ", color: "#111" }];
  const t = (id: string, categoryId: string, amountSatang: number) => ({
    id, type: "expense" as const, categoryId, accountId: "a", amountSatang, note: "", account: "", occurredOn: "2026-11-01",
  });
  assert.deepEqual(budgetTotals(cats, [t("1", "c1", 30000), t("2", "c2", 999)]), { budgetSatang: 100000, usedSatang: 30000 });
  assert.equal(budgetTotals([cats[1]], []), null);
});
