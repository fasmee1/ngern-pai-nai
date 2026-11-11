"use client";

import { budgetTotals, formatBaht, type Category, type Transaction } from "@/lib/summary";
import { CategoryBadge } from "./summary-screen";

// Budget progress for each expense category this month.
export function BudgetView({
  categories,
  transactions,
  onEditBudgets,
}: {
  categories: Category[];
  transactions: Transaction[];
  onEditBudgets: () => void;
}) {
  const spent = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.type !== "expense") continue;
    spent.set(tx.categoryId, (spent.get(tx.categoryId) ?? 0) + tx.amountSatang);
  }
  const totals = budgetTotals(categories, transactions);
  const withBudget = categories.filter((c) => c.budgetSatang !== undefined);
  const withoutBudget = categories.filter((c) => c.budgetSatang === undefined);

  return (
    <>
      {totals ? (
        <section className="balance-card" aria-labelledby="budget-title">
          <p id="budget-title" className="bc-label">{totals.usedSatang > totals.budgetSatang ? "ใช้เกินงบรวมไปแล้ว" : "งบที่เหลือเดือนนี้"}</p>
          <p className="bc-amount">
            <span>{formatBaht(Math.abs(totals.budgetSatang - totals.usedSatang))}</span>
            <small>บาท</small>
          </p>
          <div className="bc-meter" role="img" aria-label={`ใช้ไป ${Math.round((totals.usedSatang / totals.budgetSatang) * 100)}% ของงบรวม`}>
            <span style={{ width: `${Math.min(100, (totals.usedSatang / totals.budgetSatang) * 100)}%` }} />
          </div>
          <p className="bc-note">ใช้ไป {formatBaht(totals.usedSatang)} จากงบรวม {formatBaht(totals.budgetSatang)} บาท</p>
          <button type="button" className="bc-action" onClick={onEditBudgets}>ปรับงบ</button>
        </section>
      ) : (
        <section className="empty">
          <h2>ยังไม่ได้ตั้งงบ</h2>
          <p>ตั้งงบรายหมวด แล้วจะเห็นว่าแต่ละหมวดไปถึงไหนแล้ว</p>
          <button type="button" className="primary" onClick={onEditBudgets}>ตั้งงบ</button>
        </section>
      )}

      {withBudget.length > 0 ? (
        <section className="card">
          <ul className="budget-rows">
            {withBudget.map((c) => {
              const used = spent.get(c.id) ?? 0;
              const budget = c.budgetSatang ?? 0;
              const ratio = budget === 0 ? 0 : used / budget;
              const over = used > budget;
              return (
                <li key={c.id}>
                  <div className="budget-row-head">
                    <span className="budget-row-name">
                      <CategoryBadge category={c} />
                      {c.name}
                    </span>
                    <span className={over ? "budget-row-value over" : "budget-row-value"}>
                      {formatBaht(used)} / {formatBaht(budget)}
                    </span>
                  </div>
                  <div className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.round(ratio * 100))} aria-label={`${c.name} ใช้ไปแล้ว`}>
                    <span style={{ width: `${Math.min(100, ratio * 100)}%`, background: over ? "#ff3e00" : c.color }} />
                  </div>
                  {over ? <p className="budget-note">เกินงบไป {formatBaht(used - budget)} บาท</p> : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {withoutBudget.length > 0 && withBudget.length > 0 ? (
        <p className="hint">หมวดที่ยังไม่ได้ตั้งงบ: {withoutBudget.map((c) => c.name).join(", ")}</p>
      ) : null}
    </>
  );
}
