"use client";

// The full list with a search box, a type switch and category chips.

import { useMemo, useState } from "react";
import { filterTransactions, formatBaht, type Category, type ListFilter, type Transaction } from "@/lib/summary";
import { TransactionList } from "./summary-screen";

const TYPES: { id: ListFilter["type"]; label: string }[] = [
  { id: "all", label: "ทั้งหมด" },
  { id: "expense", label: "รายจ่าย" },
  { id: "income", label: "รายรับ" },
];

export function ListView({
  transactions,
  categories,
  onEdit,
}: {
  transactions: Transaction[];
  categories: Category[];
  onEdit: (tx: Transaction) => void;
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<ListFilter["type"]>("all");
  const [categoryId, setCategoryId] = useState<string | null>(null);

  // Only offer categories that actually appear this month.
  const used = useMemo(() => {
    const ids = new Set(transactions.map((t) => t.categoryId));
    return categories.filter((c) => ids.has(c.id));
  }, [transactions, categories]);

  const rows = useMemo(() => filterTransactions(transactions, categories, { query, type, categoryId }), [transactions, categories, query, type, categoryId]);
  const filtering = query.trim() !== "" || type !== "all" || categoryId !== null;
  const sum = (kind: "income" | "expense") => rows.filter((t) => t.type === kind).reduce((s, t) => s + t.amountSatang, 0);

  return (
    <>
      <section className="list-tools" aria-label="ค้นหาและกรองรายการ">
        <input
          type="search"
          className="list-search"
          placeholder="ค้นหา เช่น กาแฟ หรือ อาหาร"
          value={query}
          maxLength={40}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="ค้นหารายการ"
        />
        <div className="seg" role="radiogroup" aria-label="ชนิดรายการ">
          {TYPES.map((t) => (
            <button key={t.id} type="button" role="radio" aria-checked={type === t.id} onClick={() => setType(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        {used.length > 1 ? (
          <div className="quick-row" role="radiogroup" aria-label="หมวด">
            <button type="button" role="radio" aria-checked={categoryId === null} className="chip" onClick={() => setCategoryId(null)}>ทุกหมวด</button>
            {used.map((c) => (
              <button key={c.id} type="button" role="radio" aria-checked={categoryId === c.id} className="chip" onClick={() => setCategoryId(categoryId === c.id ? null : c.id)}>
                <span className="dot" style={{ background: c.color }} />
                {c.name}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      {filtering ? (
        <p className="list-sum" role="status">
          เจอ {rows.length} รายการ
          {sum("expense") > 0 ? ` · จ่าย ${formatBaht(sum("expense"))}` : ""}
          {sum("income") > 0 ? ` · รับ ${formatBaht(sum("income"))}` : ""}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <section className="empty">
          <h2>ไม่เจอรายการที่ตรงกัน</h2>
          <p>ลองเปลี่ยนคำค้นหา หรือเลือกหมวดอื่นดูนะ</p>
        </section>
      ) : (
        <section className="card">
          <TransactionList transactions={rows} categories={categories} onEdit={onEdit} />
        </section>
      )}
    </>
  );
}
