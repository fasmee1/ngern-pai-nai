import { test } from "node:test";
import assert from "node:assert/strict";
import { billState, goalPercent, monthlyNeeded, parseDeadline, parseDueDay, type Bill } from "./plans.ts";

const bill: Bill = { id: "b", name: "เน็ต", amountSatang: 59900, categoryId: null, accountId: null, dueDay: 15, lastPaidMonth: null };

test("parseDueDay accepts 1-28 only", () => {
  assert.equal(parseDueDay("15"), 15);
  assert.equal(parseDueDay("29"), null);
  assert.equal(parseDueDay("0"), null);
  assert.equal(parseDueDay("abc"), null);
});

test("parseDeadline rejects past and fake dates", () => {
  assert.equal(parseDeadline("2027-05-01", "2026-11-10"), "2027-05-01");
  assert.equal(parseDeadline("2026-11-09", "2026-11-10"), null);
  assert.equal(parseDeadline("2027-02-30", "2026-11-10"), null);
});

test("goalPercent stays between 0 and 100", () => {
  assert.equal(goalPercent(25000, 100000), 25);
  assert.equal(goalPercent(200000, 100000), 100);
  assert.equal(goalPercent(0, 0), 0);
});

test("monthlyNeeded splits what is left over the months to the deadline", () => {
  const goal = { id: "g", name: "x", targetSatang: 600000, savedSatang: 0, deadline: "2027-05-10" };
  assert.equal(monthlyNeeded(goal, "2026-11-10"), 600000 / 6);
  assert.equal(monthlyNeeded({ ...goal, deadline: null }, "2026-11-10"), null);
  assert.equal(monthlyNeeded({ ...goal, savedSatang: 600000 }, "2026-11-10"), null);
});

test("billState tells paid, due and upcoming apart", () => {
  assert.deepEqual(billState(bill, "2026-11-10"), { kind: "soon", inDays: 5 });
  assert.deepEqual(billState(bill, "2026-11-17"), { kind: "due", lateDays: 2 });
  assert.deepEqual(billState({ ...bill, lastPaidMonth: "2026-11-01" }, "2026-11-17"), { kind: "paid" });
  assert.deepEqual(billState({ ...bill, lastPaidMonth: "2026-10-01" }, "2026-11-17"), { kind: "due", lateDays: 2 });
});
