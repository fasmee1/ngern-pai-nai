import { test } from "node:test";
import assert from "node:assert/strict";
import { buildEntryPrompt, parseEntry } from "./quick-entry.ts";

const cats = [
  { id: "a", name: "อาหาร", type: "expense" as const },
  { id: "b", name: "เงินเดือน", type: "income" as const },
];
const today = "2026-11-10";

test("parseEntry maps a reply to form fields", () => {
  const e = parseEntry('{"type":"expense","amount":60,"categoryName":"อาหาร","note":"ข้าวเที่ยง","date":null}', cats, today);
  assert.deepEqual(e, { type: "expense", amount: "60", categoryId: "a", note: "ข้าวเที่ยง", date: null });
});

test("parseEntry keeps a valid date and drops a bad one", () => {
  const ok = parseEntry('{"type":"expense","amount":12.5,"categoryName":null,"note":"","date":"2026-11-09"}', cats, today);
  assert.equal(ok?.date, "2026-11-09");
  assert.equal(ok?.categoryId, null);
  const bad = parseEntry('{"type":"expense","amount":5,"categoryName":null,"note":"","date":"2099-01-01"}', cats, today);
  assert.equal(bad?.date, null);
});

test("parseEntry ignores a category of the wrong type", () => {
  const e = parseEntry('{"type":"expense","amount":5,"categoryName":"เงินเดือน","note":"","date":null}', cats, today);
  assert.equal(e?.categoryId, null);
});

test("parseEntry rejects zero amount and broken JSON", () => {
  assert.equal(parseEntry('{"type":"expense","amount":0,"categoryName":null,"note":"","date":null}', cats, today), null);
  assert.equal(parseEntry("not json", cats, today), null);
});

test("buildEntryPrompt lists the categories and today", () => {
  const p = buildEntryPrompt(today, cats);
  assert.match(p, /2026-11-10/);
  assert.match(p, /อาหาร/);
  assert.match(p, /เงินเดือน/);
});

import { buildReceiptPrompt, isSafeImage } from "./quick-entry.ts";

test("only small real picture data is accepted", () => {
  assert.equal(isSafeImage("image/jpeg", "QUJD"), true);
  assert.equal(isSafeImage("image/png", "QUJD=="), true);
  assert.equal(isSafeImage("text/html", "QUJD"), false);
  assert.equal(isSafeImage("image/jpeg", ""), false);
  assert.equal(isSafeImage("image/jpeg", "not base64!"), false);
  assert.equal(isSafeImage("image/jpeg", "A".repeat(900_001)), false);
  assert.equal(isSafeImage(undefined, "QUJD"), false);
});

test("receipt prompt warns that the picture is data and keeps account numbers out", () => {
  const text = buildReceiptPrompt("2026-11-11", [{ id: "1", name: "อาหาร", type: "expense" }]);
  assert.ok(text.includes("เป็นข้อมูลเท่านั้น"));
  assert.ok(text.includes("ห้ามใส่เลขบัญชี"));
  assert.ok(text.includes("อาหาร"));
});
