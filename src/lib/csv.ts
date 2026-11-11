// Turns transactions into a spreadsheet file (CSV). Pure, so it can be tested.

export type CsvRow = {
  date: string;
  type: "income" | "expense";
  category: string;
  account: string;
  amountSatang: number;
  note: string;
};

// One cell. Quotes are doubled, and a cell that starts like a formula gets a leading quote so a
// spreadsheet never runs it (someone could have typed "=HYPERLINK(...)" as a note).
export function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

function baht(satang: number): string {
  return (satang / 100).toFixed(2);
}

// The BOM at the start lets Excel read Thai text correctly.
export function toCsv(rows: CsvRow[]): string {
  const header = ["วันที่", "ชนิด", "หมวด", "บัญชี", "จำนวนเงิน (บาท)", "บันทึก"];
  const lines = [header.map(csvCell).join(",")];
  for (const r of rows) {
    lines.push(
      [r.date, r.type === "income" ? "รายรับ" : "รายจ่าย", r.category, r.account, baht(r.amountSatang), r.note].map(csvCell).join(","),
    );
  }
  return `﻿${lines.join("\r\n")}\r\n`;
}
