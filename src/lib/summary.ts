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

// Today's room to spend. The month's balance plus what was already spent today is split over the days left
// (today included), so every expense written down today lowers "left" at once. Null when nothing is left.
export type TodayAllowance = { budgetSatang: number; spentSatang: number; leftSatang: number };
export function todayAllowance(balanceSatang: number, spentTodaySatang: number, daysLeft: number): TodayAllowance | null {
  const startOfDay = balanceSatang + spentTodaySatang;
  if (startOfDay <= 0 || daysLeft <= 0) return null;
  const budgetSatang = Math.floor(startOfDay / daysLeft);
  return { budgetSatang, spentSatang: spentTodaySatang, leftSatang: budgetSatang - spentTodaySatang };
}

export type FrequentEntry = { note: string; categoryId: string; accountId: string; amountSatang: number; count: number };

// Expenses written down at least twice with the same note, category and account. Newest amount wins.
// Transactions arrive newest first.
export function frequentEntries(transactions: Transaction[], limit = 4): FrequentEntry[] {
  const groups = new Map<string, FrequentEntry>();
  for (const t of transactions) {
    const note = t.note.trim();
    if (t.type !== "expense" || !note || !t.accountId) continue;
    const key = `${note}|${t.categoryId}|${t.accountId}`;
    const found = groups.get(key);
    if (found) found.count += 1;
    else groups.set(key, { note, categoryId: t.categoryId, accountId: t.accountId, amountSatang: t.amountSatang, count: 1 });
  }
  return [...groups.values()].filter((g) => g.count >= 2).sort((a, b) => b.count - a.count).slice(0, limit);
}

export type ListFilter = { query: string; type: "all" | "expense" | "income"; categoryId: string | null };

// Keeps the rows that match the search words (note or category name), the type, and the category.
export function filterTransactions(transactions: Transaction[], categories: Category[], filter: ListFilter): Transaction[] {
  const words = filter.query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const nameOf = new Map(categories.map((c) => [c.id, c.name.toLowerCase()]));
  return transactions.filter((t) => {
    if (filter.type !== "all" && t.type !== filter.type) return false;
    if (filter.categoryId && t.categoryId !== filter.categoryId) return false;
    const haystack = `${t.note.toLowerCase()} ${nameOf.get(t.categoryId) ?? ""}`;
    return words.every((w) => haystack.includes(w));
  });
}

// Total budget and how much of it is used, over the categories that have a budget. Null when none is set.
export function budgetTotals(categories: Category[], transactions: Transaction[]): { budgetSatang: number; usedSatang: number } | null {
  const withBudget = categories.filter((c) => c.budgetSatang !== undefined && c.budgetSatang > 0);
  if (withBudget.length === 0) return null;
  const ids = new Set(withBudget.map((c) => c.id));
  const usedSatang = transactions.filter((t) => t.type === "expense" && ids.has(t.categoryId)).reduce((s, t) => s + t.amountSatang, 0);
  return { budgetSatang: withBudget.reduce((s, c) => s + (c.budgetSatang ?? 0), 0), usedSatang };
}
