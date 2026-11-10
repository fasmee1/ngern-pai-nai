import assert from "node:assert/strict";
import test from "node:test";
import { buildAdvisorContext, parseChat } from "./ai-prompt.ts";

const base = {
  today: "2026-11-10",
  monthEnd: "2026-11-30",
  monthLabel: "พฤศจิกายน 2569",
  incomeSatang: 3000000,
  expenseSatang: 1000000,
  categories: [
    { name: "อาหาร", spentSatang: 150000, budgetSatang: 100000 },
    { name: "เดินทาง", spentSatang: 50000 },
  ],
  history: [{ label: "ตุลาคม 2569", totalSatang: 1200000, categories: [{ name: "อาหาร", satang: 400000 }] }],
  accounts: [{ name: "เงินสด", balanceSatang: 500000 }],
};

test("context has worked-out numbers and no notes", () => {
  const text = buildAdvisorContext(base);
  assert.ok(text.includes("เหลืออีก 21 วัน"));
  // 20,000 baht left over 21 days is 952.38 baht a day.
  assert.ok(text.includes("วันละ 952.38 บาท"));
  assert.ok(text.includes("เกินงบ"));
  assert.ok(text.includes("เฉลี่ย 12,000"));
  assert.ok(text.includes("เงินสด"));
});

test("context says so when spending is over income", () => {
  const text = buildAdvisorContext({ ...base, expenseSatang: 3500000 });
  assert.ok(text.includes("ใช้เกินรายรับแล้ว"));
});

test("parseChat accepts a normal conversation that ends with the user", () => {
  const ok = parseChat([{ role: "user", text: " สวัสดี " }]);
  assert.deepEqual(ok, [{ role: "user", text: "สวัสดี" }]);
});

test("parseChat rejects bad input", () => {
  assert.equal(parseChat(null), null);
  assert.equal(parseChat([]), null);
  assert.equal(parseChat([{ role: "ai", text: "x" }]), null);
  assert.equal(parseChat([{ role: "user", text: "   " }]), null);
  assert.equal(parseChat([{ role: "system", text: "x" }]), null);
  assert.equal(parseChat(Array.from({ length: 21 }, () => ({ role: "user", text: "x" }))), null);
});

test("parseChat cuts a user message to 500 characters", () => {
  const out = parseChat([{ role: "user", text: "ก".repeat(900) }]);
  assert.equal(out?.[0].text.length, 500);
});

test("parseAnswer keeps good table and chart, drops bad ones", async () => {
  const { parseAnswer } = await import("./ai-prompt.ts");
  const ok = parseAnswer(JSON.stringify({
    spoken: "เดือนนี้เหลือสองหมื่นบาท",
    text: "ภาพรวมเดือนนี้",
    table: { title: "แผน", columns: ["ขั้น", "จำนวน"], rows: [["เก็บ", "5,000"], ["ใช้", "15,000"]] },
    chart: { title: "รายจ่าย", unit: "บาท", items: [{ label: "อาหาร", value: 1500 }, { label: "ติดลบ", value: -5 }, { label: "x", value: "9" }] },
  }));
  assert.equal(ok?.table?.rows.length, 2);
  assert.deepEqual(ok?.chart?.items, [{ label: "อาหาร", value: 1500 }]);

  const noVisual = parseAnswer(JSON.stringify({ spoken: "สวัสดี", text: "สวัสดี", table: null, chart: { items: [] } }));
  assert.equal(noVisual?.table, undefined);
  assert.equal(noVisual?.chart, undefined);
});

test("parseAnswer falls back to plain text when the AI did not send JSON", async () => {
  const { parseAnswer } = await import("./ai-prompt.ts");
  assert.equal(parseAnswer("ตอบธรรมดา")?.text, "ตอบธรรมดา");
  assert.equal(parseAnswer("   "), null);
  assert.equal(parseAnswer("[1,2]"), null);
});

test("parseAnswer rejects cut-off JSON instead of showing it", async () => {
  const { parseAnswer } = await import("./ai-prompt.ts");
  assert.equal(parseAnswer('{"spoken":"สวัสดี","text":"ตัดกลาง'), null);
});

test("partialAnswer shows what has been written so far, in order", async () => {
  const { partialAnswer } = await import("./ai-prompt.ts");
  const full = JSON.stringify({
    chart: { title: "รายจ่าย", unit: "บาท", items: [{ label: "อาหาร", value: 1500 }, { label: "เดินทาง", value: 500 }] },
    table: { title: "แผน", columns: ["ขั้น", "จำนวน"], rows: [["เก็บ", "5,000"], ["ใช้", "15,000"]] },
    text: "1. เก็บก่อน 2. ใช้ที่เหลือ",
  });
  // Every possible cut of the stream must either show nothing or show something valid, never throw.
  let sawChart = false;
  let sawTable = false;
  let sawText = false;
  for (let i = 1; i <= full.length; i++) {
    const part = partialAnswer(full.slice(0, i));
    if (!part) continue;
    if (part.chart) sawChart = true;
    if (part.table) sawTable = true;
    if (part.text) sawText = true;
    // Words never appear before the picture they belong with.
    if (part.text) assert.ok(part.chart && part.table);
  }
  assert.ok(sawChart && sawTable && sawText);
  assert.equal(partialAnswer(full)?.text, "1. เก็บก่อน 2. ใช้ที่เหลือ");
  assert.equal(partialAnswer(""), null);
  assert.equal(partialAnswer('{"te'), null);
  assert.equal(partialAnswer('{"text":"สวัสดี')?.text, "สวัสดี");
});
