import assert from "node:assert/strict";
import test from "node:test";
import { BANKS, bankByCode, logoPath, parseBankCodes } from "./banks.ts";

test("every bank has a unique code and a name", () => {
  const codes = BANKS.map((b) => b.code);
  assert.equal(new Set(codes).size, codes.length);
  for (const b of BANKS) assert.ok(b.name.length > 0 && /^#[0-9a-f]{6}$/i.test(b.color));
});

test("keeps only known bank codes once", () => {
  assert.deepEqual(parseBankCodes(["kbank", "kbank", "nope", 5, "scb"]), ["kbank", "scb"]);
  assert.deepEqual(parseBankCodes("kbank"), []);
});

test("finds banks and logo files", () => {
  assert.equal(bankByCode("scb")?.short, "SCB");
  assert.equal(logoPath("scb"), "/banks/scb.png");
  assert.equal(logoPath("exim"), null);
  assert.equal(bankByCode(null), undefined);
});
