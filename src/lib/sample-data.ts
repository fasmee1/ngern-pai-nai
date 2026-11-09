import type { Category, Transaction } from "./summary";

// Made-up figures for the preview. Replaced by real data in phase 2.
export const sampleCategories: Category[] = [
  { id: "food", name: "ค่าอาหาร", color: "#918df6", budgetSatang: 500_000 },
  { id: "travel", name: "ค่าเดินทาง", color: "#2c78fc", budgetSatang: 400_000 },
  { id: "home", name: "ค่าที่พัก", color: "#33c758", budgetSatang: 300_000 },
  { id: "other", name: "อื่น ๆ", color: "#ffa600", budgetSatang: 200_000 },
];

export const sampleTransactions: Transaction[] = [
  { id: "t1", type: "expense", categoryId: "food", amountSatang: 6_500, note: "กาแฟ", account: "พร้อมเพย์", occurredOn: "2026-11-07" },
  { id: "t2", type: "expense", categoryId: "food", amountSatang: 6_000, note: "ข้าวมันไก่", account: "เงินสด", occurredOn: "2026-11-07" },
  { id: "t3", type: "expense", categoryId: "travel", amountSatang: 10_000, note: "รถไฟฟ้า", account: "พร้อมเพย์", occurredOn: "2026-11-06" },
  { id: "t4", type: "expense", categoryId: "other", amountSatang: 59_900, note: "ค่าอินเทอร์เน็ต", account: "พร้อมเพย์", occurredOn: "2026-11-05" },
  { id: "t5", type: "expense", categoryId: "other", amountSatang: 50_100, note: "ของใช้ในบ้าน", account: "พร้อมเพย์", occurredOn: "2026-11-04" },
  { id: "t6", type: "expense", categoryId: "food", amountSatang: 507_500, note: "ค่าอาหารต้นเดือน", account: "พร้อมเพย์", occurredOn: "2026-11-03" },
  { id: "t7", type: "expense", categoryId: "travel", amountSatang: 300_000, note: "ค่าเดินทางต้นเดือน", account: "พร้อมเพย์", occurredOn: "2026-11-02" },
  { id: "t8", type: "expense", categoryId: "home", amountSatang: 300_000, note: "ค่าห้อง", account: "พร้อมเพย์", occurredOn: "2026-11-01" },
  { id: "t9", type: "income", categoryId: "salary", amountSatang: 2_500_000, note: "เงินเดือน", account: "ธนาคาร", occurredOn: "2026-11-01" },
];
