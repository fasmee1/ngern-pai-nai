import assert from "node:assert/strict";
import test from "node:test";
import { csvCell, toCsv } from "./csv.ts";

test("cells with commas or quotes are quoted", () => {
  assert.equal(csvCell("กาแฟ"), "กาแฟ");
  assert.equal(csvCell("a,b"), '"a,b"');
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
});

test("cells that look like formulas are made safe", () => {
  assert.equal(csvCell("=1+1"), "'=1+1");
  assert.equal(csvCell("@SUM(A1)"), "'@SUM(A1)");
  assert.equal(csvCell("-5"), "'-5");
});

test("csv has a Thai header, amounts in baht, and a byte order mark", () => {
  const text = toCsv([{ date: "2026-11-01", type: "expense", category: "อาหาร", account: "เงินสด", amountSatang: 4550, note: "กาแฟ" }]);
  assert.ok(text.startsWith("﻿วันที่,ชนิด,หมวด,บัญชี,จำนวนเงิน (บาท),บันทึก\r\n"));
  assert.ok(text.includes("2026-11-01,รายจ่าย,อาหาร,เงินสด,45.50,กาแฟ\r\n"));
});
