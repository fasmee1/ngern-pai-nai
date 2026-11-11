// Builds what the AI is told about the person's money. The numbers are worked out here, never by the AI.
// Only totals are sent: no notes and no names of people.

import { parsePartialJson } from "./ai-stream.ts";
import { formatBaht } from "./summary.ts";

export type AdvisorInput = {
  // Today as YYYY-MM-DD (Thailand time) and the last day of this month as YYYY-MM-DD.
  today: string;
  monthEnd: string;
  monthLabel: string;
  incomeSatang: number;
  expenseSatang: number;
  // This month's spending per category, with the budget when one is set.
  categories: { name: string; spentSatang: number; budgetSatang?: number }[];
  // Earlier months, newest first.
  history: { label: string; totalSatang: number; categories: { name: string; satang: number }[] }[];
  accounts: { name: string; balanceSatang: number }[];
  // Savings goals and monthly bills, when the person has set any.
  goals?: { name: string; savedSatang: number; targetSatang: number; deadline: string | null }[];
  bills?: { name: string; amountSatang: number; dueDay: number; paidThisMonth: boolean }[];
};

export const ADVISOR_SYSTEM =
  "คุณคือผู้ช่วยวางแผนการเงินส่วนตัวของคนไทยในแอป เงินไปไหน ช่วยเรื่องวางแผนใช้เงิน วางแผนเก็บเงิน ตั้งงบ ลดรายจ่าย และอธิบายตัวเลขของผู้ใช้ " +
  "พูดสุภาพ อบอุ่น ใช้คำง่าย ๆ เหมือนเพื่อนที่เข้าใจเรื่องเงิน ไม่ตัดสินหรือตำหนิ ผู้ใช้ไม่ถนัดศัพท์การเงิน " +
  "ใช้ตัวเลขจากข้อมูลที่ให้เท่านั้น ห้ามเดาหรือแต่งตัวเลข ถ้าต้องคำนวณเพิ่มให้คำนวณให้ถูกและบอกวิธีคิดสั้น ๆ " +
  "เมื่อผู้ใช้ขอให้วางแผน ตั้งงบ หรือแนะนำ ให้เสนอแผนที่มีตัวเลขจริงจากข้อมูลทันที ห้ามตอบกว้าง ๆ หรือตอบแค่ถามกลับ " +
  "ใช้ตัวเลขช่วยวางแผนที่คำนวณไว้ให้ในข้อมูล แล้วใส่ในตารางหรือแผนภูมิ ถ้าข้อมูลน้อยให้บอกตรง ๆ ว่ามีข้อมูลแค่ไหน แล้วเสนอแผนจากสัดส่วนมาตรฐานเป็นตัวอย่างที่บอกชัดว่าสมมติ " +
  "ถ้ายังขาดข้อมูลสำคัญ เช่น รายรับต่อเดือน หรือเป้าเก็บเงิน ให้เสนอแผนก่อน แล้วถามกลับสั้น ๆ ข้อเดียวท้ายคำตอบ " +
  "ไม่แนะนำหุ้น กองทุน หรือสินทรัพย์เสี่ยงเป็นรายตัว และไม่รับประกันผลตอบแทน " +
  "ถ้าถามเรื่องที่ไม่เกี่ยวกับเงิน ให้ตอบสั้น ๆ ว่าช่วยได้เฉพาะเรื่องเงิน " +
  "ตอบเป็น JSON ตามรูปแบบที่กำหนดเท่านั้น: " +
  "ลำดับฟิลด์ใน JSON ต้องเป็น chart, table, text โดย text เป็นฟิลด์สุดท้ายเสมอ เพื่อให้ภาพขึ้นก่อนคำอธิบาย " +
  "text คือคำอธิบายสั้น ไม่เกิน 5 ประโยคและไม่เกิน 600 ตัวอักษร ถ้าเป็นแผนให้เขียนเป็นข้อ ๆ ขึ้นต้น 1. 2. 3. " +
  "table คือตารางสรุป (หัวตารางไม่เกิน 4 คอลัมน์ ไม่เกิน 8 แถว ค่าในช่องเป็นข้อความสั้น ๆ) " +
  "chart คือแผนภูมิแท่งเทียบจำนวนเงินเป็นบาท (ไม่เกิน 8 รายการ) " +
  "ถ้าคำตอบเกี่ยวกับตัวเลข แผนใช้เงิน หรือแผนเก็บเงิน ต้องมี table หรือ chart อย่างน้อยหนึ่งอย่างเสมอ เพราะผู้ใช้จะดูภาพก่อนอ่านข้อความ " +
  "ใช้ chart เมื่อเทียบจำนวนเงินระหว่างหมวดหรือเดือน ใช้ table เมื่อเป็นแผนเป็นขั้นหรือมีหลายคอลัมน์ ถ้าไม่ต้องมี chart หรือ table ให้ใส่ null " +
  "ถ้าผู้ใช้แค่ทักทายหรือคุยทั่วไป ให้ตอบสั้น ๆ ชวนถามเรื่องเงิน ไม่ต้องสรุปตัวเลข และไม่ต้องมี table หรือ chart " +
  "เขียนตัวเลขเป็นเลขอารบิกเสมอ เช่น 20,000 บาท ห้ามเขียนเป็นคำอ่าน " +
  "คงเหลือของเดือนนี้ (รายรับหักรายจ่าย) กับเงินในบัญชี เป็นคนละอย่างกัน ใช้ให้ถูกและอย่าสับสน " +
  "ห้ามใช้ markdown เช่น ดอกจัน หัวข้อ # ห้ามใช้อีโมจิ ห้ามลงท้ายประโยคด้วยคำที่บอกเพศ คือ ค่ะ คะ ครับ ให้พูดกลาง ๆ";

function daysLeftInMonth(today: string, monthEnd: string): number {
  return Number(monthEnd.slice(8, 10)) - Number(today.slice(8, 10)) + 1;
}

export function buildAdvisorContext(input: AdvisorInput): string {
  const { today, monthEnd, monthLabel, incomeSatang, expenseSatang, categories, history, accounts, goals = [], bills = [] } = input;
  const lines: string[] = [];
  const daysLeft = Math.max(1, daysLeftInMonth(today, monthEnd));
  const leftSatang = incomeSatang - expenseSatang;

  lines.push(`ข้อมูลการเงินของผู้ใช้ (หน่วย บาท) วันนี้ ${today} เหลืออีก ${daysLeft} วันจะสิ้นเดือน`);
  lines.push(`เดือน ${monthLabel}: รายรับ ${formatBaht(incomeSatang)} รายจ่าย ${formatBaht(expenseSatang)} คงเหลือจากรายรับหักรายจ่ายของเดือนนี้ ${formatBaht(leftSatang)}`);
  if (leftSatang > 0) {
    lines.push(`ถ้าอยากไม่ให้เกินรายรับ ใช้ได้เฉลี่ยวันละ ${formatBaht(Math.floor(leftSatang / daysLeft))} บาท ตลอด ${daysLeft} วันที่เหลือ`);
  } else if (incomeSatang > 0) {
    lines.push("เดือนนี้ใช้เกินรายรับแล้ว");
  } else {
    lines.push("เดือนนี้ยังไม่มีรายรับที่จดไว้");
  }

  if (categories.length > 0) {
    lines.push("รายจ่ายเดือนนี้แยกหมวด:");
    for (const c of categories) {
      const budget = c.budgetSatang && c.budgetSatang > 0
        ? c.spentSatang > c.budgetSatang
          ? ` งบ ${formatBaht(c.budgetSatang)} เกินงบ ${formatBaht(c.spentSatang - c.budgetSatang)}`
          : ` งบ ${formatBaht(c.budgetSatang)} เหลือ ${formatBaht(c.budgetSatang - c.spentSatang)}`
        : "";
      lines.push(`- ${c.name} ${formatBaht(c.spentSatang)}${budget}`);
    }
  }

  const past = history.filter((h) => h.totalSatang > 0);
  if (past.length > 0) {
    const avg = Math.round(past.reduce((sum, h) => sum + h.totalSatang, 0) / past.length);
    lines.push(`รายจ่ายเดือนก่อน ๆ (เฉลี่ย ${formatBaht(avg)} ต่อเดือน):`);
    for (const h of past) {
      const top = h.categories.filter((c) => c.satang > 0).sort((a, b) => b.satang - a.satang).slice(0, 5);
      lines.push(`- ${h.label} รวม ${formatBaht(h.totalSatang)}${top.length ? ` (${top.map((c) => `${c.name} ${formatBaht(c.satang)}`).join(", ")})` : ""}`);
    }
  } else {
    lines.push("ยังไม่มีรายจ่ายเดือนก่อน ๆ ให้เทียบ");
  }

  // Numbers worked out here so the AI can plan with them instead of guessing.
  lines.push("ตัวเลขช่วยวางแผน (คำนวณไว้แล้ว ใช้ได้เลย):");
  if (incomeSatang > 0) {
    lines.push(`- เก็บเงิน 20% ของรายรับเดือนนี้ = ${formatBaht(Math.round(incomeSatang * 0.2))} บาท เหลือใช้ได้ ${formatBaht(incomeSatang - Math.round(incomeSatang * 0.2))} บาท`);
  }
  const perCategory = new Map<string, { sum: number; months: number }>();
  const addCategory = (name: string, satang: number) => {
    if (satang <= 0) return;
    const cur = perCategory.get(name) ?? { sum: 0, months: 0 };
    perCategory.set(name, { sum: cur.sum + satang, months: cur.months + 1 });
  };
  for (const c of categories) addCategory(c.name, c.spentSatang);
  for (const h of past) for (const c of h.categories) addCategory(c.name, c.satang);
  if (perCategory.size > 0) {
    lines.push("- ค่าเฉลี่ยต่อเดือนของแต่ละหมวด และงบแนะนำแบบประหยัดลง 10%:");
    for (const [name, { sum, months }] of perCategory) {
      const avgCat = Math.round(sum / months);
      lines.push(`  - ${name} เฉลี่ย ${formatBaht(avgCat)} (จาก ${months} เดือน) งบแนะนำ ${formatBaht(Math.round(avgCat * 0.9))}`);
    }
  } else {
    lines.push("- ข้อมูลรายจ่ายยังน้อยมาก ยังคำนวณงบรายหมวดไม่ได้");
  }
  if (incomeSatang <= 0) {
    lines.push("- ยังไม่มีรายรับที่จดไว้ ถ้าต้องวางแผนให้เสนอสัดส่วนมาตรฐาน 50% ของจำเป็น 30% ของอยากได้ 20% เก็บออม เป็นตัวอย่าง (บอกว่าเป็นตัวอย่างสมมติ) แล้วถามรายรับต่อเดือนของผู้ใช้");
  }

  if (accounts.length > 0) {
    const total = accounts.reduce((sum, a) => sum + a.balanceSatang, 0);
    lines.push(`เงินในบัญชีตอนนี้ รวม ${formatBaht(total)}:`);
    for (const a of accounts) lines.push(`- ${a.name} ${formatBaht(a.balanceSatang)}`);
  }

  if (goals.length > 0) {
    lines.push("เป้าหมายออมเงิน:");
    for (const g of goals) {
      const percent = g.targetSatang > 0 ? Math.min(100, Math.floor((g.savedSatang / g.targetSatang) * 100)) : 0;
      lines.push(`- ${g.name} เก็บได้ ${formatBaht(g.savedSatang)} จาก ${formatBaht(g.targetSatang)} (${percent}%)${g.deadline ? ` ครบกำหนด ${g.deadline}` : ""}`);
    }
  }
  if (bills.length > 0) {
    const unpaid = bills.filter((b) => !b.paidThisMonth);
    lines.push(`บิลประจำเดือน ${bills.length} รายการ ที่ยังไม่ได้จดว่าจ่ายเดือนนี้ ${unpaid.length} รายการ รวม ${formatBaht(unpaid.reduce((s, b) => s + b.amountSatang, 0))} บาท:`);
    for (const b of bills) lines.push(`- ${b.name} ${formatBaht(b.amountSatang)} ทุกวันที่ ${b.dueDay} ${b.paidThisMonth ? "(จดแล้วเดือนนี้)" : "(ยังไม่จด)"}`);
  }

  return lines.join("\n");
}

// What the browser may send as chat history. Anything else is dropped.
export const MAX_CHAT_MESSAGES = 20;
export const MAX_CHAT_CHARS = 500;
export type ChatMessage = { role: "user" | "ai"; text: string };

export function parseChat(input: unknown): ChatMessage[] | null {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_CHAT_MESSAGES) return null;
  const out: ChatMessage[] = [];
  for (const item of input) {
    if (typeof item !== "object" || item === null) return null;
    const { role, text } = item as { role?: unknown; text?: unknown };
    if ((role !== "user" && role !== "ai") || typeof text !== "string") return null;
    const clean = text.trim().slice(0, MAX_CHAT_CHARS * (role === "ai" ? 8 : 1));
    if (!clean) return null;
    out.push({ role, text: clean });
  }
  return out[out.length - 1].role === "user" ? out : null;
}

// What the AI sends back. Anything the browser shows is checked here first.
export type AiTable = { title: string; columns: string[]; rows: string[][] };
export type AiChart = { title: string; unit: string; items: { label: string; value: number }[] };
export type AiAnswer = { text: string; table?: AiTable; chart?: AiChart };

const clip = (v: unknown, max: number): string => (typeof v === "string" ? v.trim().slice(0, max) : "");

// Picks the parts of an answer object that are safe to show. Works on half-written answers too.
function shapeAnswer(o: Record<string, unknown>): AiAnswer {
  const answer: AiAnswer = { text: clip(o.text, 1500) };

  const t = o.table as { title?: unknown; columns?: unknown; rows?: unknown } | null | undefined;
  if (t && Array.isArray(t.columns) && Array.isArray(t.rows)) {
    const columns = t.columns.slice(0, 4).map((c) => clip(c, 30));
    const rows = t.rows
      .filter((r): r is unknown[] => Array.isArray(r))
      .slice(0, 8)
      .map((r) => columns.map((_, i) => clip(r[i], 40)));
    if (columns.length > 0 && rows.length > 0 && columns.every(Boolean)) {
      answer.table = { title: clip(t.title, 60), columns, rows };
    }
  }

  const c = o.chart as { title?: unknown; unit?: unknown; items?: unknown } | null | undefined;
  if (c && Array.isArray(c.items)) {
    const items = c.items
      .map((i) => i as { label?: unknown; value?: unknown })
      .filter((i) => i && typeof i.label === "string" && typeof i.value === "number" && Number.isFinite(i.value) && i.value >= 0)
      .slice(0, 8)
      .map((i) => ({ label: clip(i.label, 30), value: i.value as number }));
    if (items.length > 0) answer.chart = { title: clip(c.title, 60), unit: clip(c.unit, 10) || "บาท", items };
  }
  return answer;
}

// The finished answer. Null when it is broken or empty.
export function parseAnswer(raw: string): AiAnswer | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    // Broken or cut-off JSON must never be shown as if it were an answer.
    const text = raw.trim();
    if (!text || text.startsWith("{") || text.startsWith("[")) return null;
    return { text: text.slice(0, 1500) };
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) return null;
  const answer = shapeAnswer(data as Record<string, unknown>);
  return answer.text ? answer : null;
}

// What has been written so far of a streaming answer, or null before anything usable has arrived.
export function partialAnswer(raw: string): AiAnswer | null {
  const data = parsePartialJson(raw);
  if (typeof data !== "object" || data === null || Array.isArray(data)) return null;
  const answer = shapeAnswer(data as Record<string, unknown>);
  return answer.text || answer.table || answer.chart ? answer : null;
}

// The most text that can be sent to be read aloud.
export const MAX_SPEAK_CHARS = 700;
