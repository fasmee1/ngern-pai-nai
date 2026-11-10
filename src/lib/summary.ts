// Money is stored in satang so totals stay exact.
export type Category = {
  id: string;
  name: string;
  color: string;
  budgetSatang?: number;
};

export type Transaction = {
  id: string;
  type: "income" | "expense";
  categoryId: string;
  accountId?: string;
  amountSatang: number;
  note: string;
  account: string;
  occurredOn: string;
};

export type Slice = Category & { spentSatang: number; share: number };

export type OverBudget = { name: string; overSatang: number };

export type Summary = {
  incomeSatang: number;
  expenseSatang: number;
  balanceSatang: number;
  slices: Slice[];
  overBudget: OverBudget[];
  headline: string;
};

export function formatBaht(satang: number): string {
  const baht = satang / 100;
  return baht.toLocaleString("th-TH", {
    minimumFractionDigits: Number.isInteger(baht) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function buildSummary(
  categories: Category[],
  transactions: Transaction[],
): Summary {
  const spent = new Map<string, number>();
  let incomeSatang = 0;
  let expenseSatang = 0;

  for (const item of transactions) {
    if (item.type === "income") {
      incomeSatang += item.amountSatang;
      continue;
    }
    expenseSatang += item.amountSatang;
    spent.set(
      item.categoryId,
      (spent.get(item.categoryId) ?? 0) + item.amountSatang,
    );
  }

  const slices = categories
    .map((category) => {
      const spentSatang = spent.get(category.id) ?? 0;
      return {
        ...category,
        spentSatang,
        share: expenseSatang === 0 ? 0 : spentSatang / expenseSatang,
      };
    })
    .filter((slice) => slice.spentSatang > 0)
    .sort((a, b) => b.spentSatang - a.spentSatang);

  const overBudget = slices.flatMap((slice) =>
    slice.budgetSatang !== undefined && slice.spentSatang > slice.budgetSatang
      ? [{ name: slice.name, overSatang: slice.spentSatang - slice.budgetSatang }]
      : [],
  );

  return {
    incomeSatang,
    expenseSatang,
    balanceSatang: incomeSatang - expenseSatang,
    slices,
    overBudget,
    headline: slices[0]
      ? `เดือนนี้ใช้${slices[0].name}เยอะสุด`
      : "ยังไม่มีรายจ่ายเดือนนี้",
  };
}

export type CategoryChange = { id: string; name: string; color: string; nowSatang: number; beforeSatang: number; diffSatang: number };

export type Comparison = {
  hasBefore: boolean;
  nowSatang: number;
  beforeSatang: number;
  diffSatang: number;
  // Percent change against last month, or null when last month had no spending.
  percent: number | null;
  rows: CategoryChange[];
  headline: string;
};

// Compares this month's spending with last month's, per category. Biggest change first.
export function buildComparison(
  categories: Category[],
  nowSatangByCategory: Record<string, number>,
  beforeSatangByCategory: Record<string, number>,
): Comparison {
  const sum = (m: Record<string, number>) => Object.values(m).reduce((a, b) => a + b, 0);
  const nowSatang = sum(nowSatangByCategory);
  const beforeSatang = sum(beforeSatangByCategory);
  const diffSatang = nowSatang - beforeSatang;

  const rows = categories
    .map((c) => {
      const now = nowSatangByCategory[c.id] ?? 0;
      const before = beforeSatangByCategory[c.id] ?? 0;
      return { id: c.id, name: c.name, color: c.color, nowSatang: now, beforeSatang: before, diffSatang: now - before };
    })
    .filter((r) => r.nowSatang > 0 || r.beforeSatang > 0)
    .sort((a, b) => Math.abs(b.diffSatang) - Math.abs(a.diffSatang));

  const hasBefore = beforeSatang > 0;
  const percent = hasBefore ? Math.round((diffSatang / beforeSatang) * 100) : null;
  const headline = !hasBefore
    ? "เดือนก่อนยังไม่มีรายจ่ายให้เทียบ"
    : diffSatang === 0
      ? "ใช้เท่ากับเดือนก่อน"
      : diffSatang > 0
        ? `ใช้มากกว่าเดือนก่อน ${formatBaht(diffSatang)} บาท`
        : `ใช้น้อยกว่าเดือนก่อน ${formatBaht(-diffSatang)} บาท`;

  return { hasBefore, nowSatang, beforeSatang, diffSatang, percent, rows, headline };
}

// Total expense per category (satang) for a list of transactions.
export function expenseByCategory(transactions: Transaction[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const item of transactions) {
    if (item.type !== "expense") continue;
    out[item.categoryId] = (out[item.categoryId] ?? 0) + item.amountSatang;
  }
  return out;
}
