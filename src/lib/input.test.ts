import assert from "node:assert/strict";
import test from "node:test";
import { initialOf, isIsoDate, parseAvatarColor, parseBaht, parseCategoryName, parseDisplayName, parseTransactionForm } from "./input.ts";

test("parses baht text into satang", () => {
  assert.equal(parseBaht("250"), 25_000);
  assert.equal(parseBaht("12.5"), 1_250);
  assert.equal(parseBaht("1,200.75"), 120_075);
  assert.equal(parseBaht(" 99.99 "), 9_999);
});

test("rejects bad amounts", () => {
  for (const bad of ["", "0", "-5", "1.234", "abc", "1e3", "99999999999"]) {
    assert.equal(parseBaht(bad), null, bad);
  }
});

test("rejects impossible dates", () => {
  assert.equal(isIsoDate("2026-02-30", "2026-11-07"), false);
  assert.equal(isIsoDate("2062-01-01", "2026-11-07"), false);
  assert.equal(isIsoDate("2026-11-07", "2026-11-07"), true);
  assert.equal(isIsoDate("07/11/2026", "2026-11-07"), false);
});

const id = "11111111-1111-4111-8111-111111111111";

test("builds a valid transaction from the form", () => {
  const form = new FormData();
  form.set("type", "expense");
  form.set("amount", "45");
  form.set("categoryId", id);
  form.set("accountId", id);
  form.set("occurredOn", "2026-11-07");
  form.set("note", "  ข้าว  ");
  const result = parseTransactionForm(form, "2026-11-07");
  assert.deepEqual(result, {
    ok: true,
    value: { type: "expense", amountSatang: 4_500, categoryId: id, accountId: id, occurredOn: "2026-11-07", note: "ข้าว" },
  });
});

test("reports the first problem in Thai", () => {
  const form = new FormData();
  form.set("type", "expense");
  form.set("amount", "");
  const result = parseTransactionForm(form, "2026-11-07");
  assert.deepEqual(result, { ok: false, error: "ใส่จำนวนเงินก่อนนะ เช่น 250" });
});

test("checks category names", () => {
  assert.equal(parseCategoryName("  ค่า   กาแฟ "), "ค่า กาแฟ");
  assert.equal(parseCategoryName("   "), null);
  assert.equal(parseCategoryName("x".repeat(41)), null);
});

test("checks profile fields", () => {
  assert.equal(parseDisplayName("  ฟัซมี  "), "ฟัซมี");
  assert.equal(parseDisplayName(""), null);
  assert.equal(parseDisplayName("a".repeat(41)), null);
  assert.equal(parseAvatarColor("#918df6"), "#918df6");
  assert.equal(parseAvatarColor("#000000"), null);
  assert.equal(initialOf("fasmee"), "F");
  assert.equal(initialOf("ฟัซมี"), "ฟ");
  assert.equal(initialOf("   "), "?");
});
