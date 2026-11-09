import assert from "node:assert/strict";
import test from "node:test";
import { buildSummary, formatBaht, type Category, type Transaction } from "./summary.ts";

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
