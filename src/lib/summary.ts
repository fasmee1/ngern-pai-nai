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
