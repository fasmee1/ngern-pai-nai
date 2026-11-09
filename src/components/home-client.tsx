"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AppShell, type Tab } from "./app-shell";
import { SummaryView, TransactionList } from "./summary-screen";
import { BudgetView } from "./budget-view";
import { TransactionSheet } from "./transaction-sheet";
import { BudgetSheet } from "./budget-sheet";
import { deleteTransaction, restoreTransaction } from "@/app/actions";
import { buildSummary, type Category, type Transaction } from "@/lib/summary";
import type { Account, MonthData, Profile } from "@/lib/load";

type Sheet = { kind: "none" } | { kind: "add" } | { kind: "edit"; tx: Transaction } | { kind: "budget" };

type Undo = { id: string; label: string } | null;

export function HomeClient({
  data,
  monthLabel,
  profile,
  initialTab = "summary",
}: {
  data: MonthData;
  email: string;
  monthLabel: string;
  profile?: Profile;
  initialTab?: Tab;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [sheet, setSheet] = useState<Sheet>({ kind: "none" });
  const [undo, setUndo] = useState<Undo>(null);
  const [, startTransition] = useTransition();

  const categories: Category[] = useMemo(
    () =>
      data.categories
        .filter((c) => c.type === "expense")
        .map((c) => ({ id: c.id, name: c.name, color: c.color, budgetSatang: data.budgets[c.id] })),
    [data],
  );

  const summary = useMemo(() => buildSummary(categories, data.transactions), [categories, data.transactions]);

  // Every category, for showing any transaction (income included).
  const allCategories: Category[] = useMemo(
    () => data.categories.map((c) => ({ id: c.id, name: c.name, color: c.color })),
    [data],
  );

  // Undo banner hides itself after a few seconds.
  useEffect(() => {
    if (!undo) return;
    const timer = setTimeout(() => setUndo(null), 6000);
    return () => clearTimeout(timer);
  }, [undo]);

  function removeRow(tx: Transaction) {
    setSheet({ kind: "none" });
    startTransition(async () => {
      const result = await deleteTransaction(tx.id);
      if (result.ok) {
        setUndo({ id: tx.id, label: "ลบรายการแล้ว" });
        router.refresh();
      }
    });
  }

  function undoRemove() {
    if (!undo) return;
    const id = undo.id;
    setUndo(null);
    startTransition(async () => {
      await restoreTransaction(id);
      router.refresh();
    });
  }

  const editing = sheet.kind === "edit" ? sheet.tx : null;
  const titles: Record<Tab, string> = { summary: "สรุปเดือนนี้", list: "รายการทั้งหมด", budget: "งบเดือนนี้" };

  return (
    <>
      <AppShell
        title={titles[tab]}
        subtitle={monthLabel}
        profile={profile}
        tab={tab}
        onTab={setTab}
        onAdd={() => setSheet({ kind: "add" })}
      >
        {tab === "summary" ? (
          <SummaryView
            summary={summary}
            transactions={data.transactions}
            categories={allCategories}
            onEdit={(tx) => setSheet({ kind: "edit", tx })}
            onAdd={() => setSheet({ kind: "add" })}
            onSeeAll={() => setTab("list")}
          />
        ) : null}

        {tab === "list" ? (
          data.transactions.length === 0 ? (
            <section className="empty">
              <h2>ยังไม่มีรายการ</h2>
              <p>กดปุ่ม + ด้านล่างเพื่อจดรายการแรก</p>
            </section>
          ) : (
            <section className="card">
              <TransactionList
                transactions={data.transactions}
                categories={allCategories}
                onEdit={(tx) => setSheet({ kind: "edit", tx })}
              />
            </section>
          )
        ) : null}

        {tab === "budget" ? (
          <BudgetView
            categories={categories}
            transactions={data.transactions}
            onEditBudgets={() => setSheet({ kind: "budget" })}
          />
        ) : null}
      </AppShell>

      {sheet.kind === "add" || sheet.kind === "edit" ? (
        <TransactionSheet
          key={editing?.id ?? "new"}
          categories={data.categories}
          accounts={data.accounts as Account[]}
          editing={editing}
          onClose={() => setSheet({ kind: "none" })}
          onSaved={() => {
            setSheet({ kind: "none" });
            router.refresh();
          }}
          onDelete={editing ? () => removeRow(editing) : undefined}
          onCategoryAdded={() => router.refresh()}
        />
      ) : null}

      {sheet.kind === "budget" ? (
        <BudgetSheet
          month={data.month}
          categories={categories}
          onClose={() => setSheet({ kind: "none" })}
          onSaved={() => {
            setSheet({ kind: "none" });
            router.refresh();
          }}
        />
      ) : null}

      {undo ? (
        <div className="undo glass" role="status">
          <span>{undo.label}</span>
          <button type="button" className="link strong" onClick={undoRemove}>
            ย้อนกลับ
          </button>
        </div>
      ) : null}
    </>
  );
}
