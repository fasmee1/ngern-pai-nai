import "server-only";

// Everything the money helper is told for one reply: its rules plus this person's own numbers.
// The numbers come from this person's rows only (row-level security) and are worked out here, not by the AI.

import { ADVISOR_SYSTEM, buildAdvisorContext } from "./ai-prompt";
import { monthEnd, thaiMonthLabel, todayInBangkok } from "./dates";
import { loadCompareData, loadMonth, loadWallets } from "./load";
import { buildSummary } from "./summary";

export async function buildAdvisorSystem(): Promise<string> {
  const [data, compare, wallets] = await Promise.all([loadMonth(), loadCompareData(), loadWallets()]);

  const expenseCategories = data.categories
    .filter((c) => c.type === "expense")
    .map((c) => ({ id: c.id, name: c.name, color: c.color, budgetSatang: data.budgets[c.id] }));
  const summary = buildSummary(expenseCategories, data.transactions);
  const nameOf = (id: string) => compare.categories.find((c) => c.id === id)?.name ?? "อื่น ๆ";

  const context = buildAdvisorContext({
    today: todayInBangkok(),
    monthEnd: monthEnd(data.month),
    monthLabel: thaiMonthLabel(data.month),
    incomeSatang: summary.incomeSatang,
    expenseSatang: summary.expenseSatang,
    categories: summary.slices.map((s) => ({ name: s.name, spentSatang: s.spentSatang, budgetSatang: s.budgetSatang })),
    history: compare.months.slice(0, 3).map((m) => {
      const byCat = compare.byMonth[m] ?? {};
      return {
        label: thaiMonthLabel(m),
        totalSatang: Object.values(byCat).reduce((a, b) => a + b, 0),
        categories: Object.entries(byCat).map(([id, satang]) => ({ name: nameOf(id), satang })),
      };
    }),
    accounts: wallets.accounts.map((a) => ({ name: a.name, balanceSatang: wallets.balances[a.id] ?? 0 })),
  });

  return `${ADVISOR_SYSTEM}\n\n${context}`;
}
