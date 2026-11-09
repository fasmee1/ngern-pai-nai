"use client";

// THESIS: the first thing you see is a sentence about your money, not a table.
// OWN-WORLD: white canvas, sky-to-lavender light, soft cards, pill controls.
// FIRST VIEWPORT: headline, glowing donut, then the three totals.

import { useState } from "react";
import { formatBaht, type Category, type Slice, type Summary, type Transaction } from "@/lib/summary";
import { thaiDateLabel } from "@/lib/dates";
import { CategoryIcon } from "./icons";

const RADIUS = 78;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 30;

export function Donut({
  slices,
  total,
  selected,
  onSelect,
}: {
  slices: Slice[];
  total: number;
  selected: Slice | null;
  onSelect: (id: string) => void;
}) {
  const usable = CIRCUMFERENCE - GAP * slices.length;
  const segments = slices.map((slice, index) => {
    const before = slices.slice(0, index).reduce((sum, item) => sum + item.share * usable + GAP, 0);
    return { slice, start: before, length: slice.share * usable };
  });

  return (
    <div className="donut">
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <circle className="donut-track" cx="100" cy="100" r={RADIUS} />
        {segments.map(({ slice, start, length }) => (
          <circle
            key={slice.id}
            className="donut-segment"
            data-dim={selected !== null && selected.id !== slice.id}
            cx="100"
            cy="100"
            r={RADIUS}
            stroke={slice.color}
            strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
            strokeDashoffset={-start}
            transform="rotate(-90 100 100)"
            onClick={() => onSelect(slice.id)}
          />
        ))}
      </svg>
      <div className="donut-center" aria-live="polite">
        <span className="donut-label">{selected ? selected.name : "ใช้ไปทั้งหมด"}</span>
        <span className="donut-value">{formatBaht(selected ? selected.spentSatang : total)}</span>
        <span className="donut-unit">{selected ? `บาท · ${Math.round(selected.share * 100)}%` : "บาท"}</span>
      </div>
    </div>
  );
}

export function CategoryDot({ category }: { category?: Category }) {
  return <span className="cat-dot" style={{ background: category?.color ?? "#e8e8e8" }} aria-hidden="true" />;
}

// Category icon on a soft tile in the category's own color.
export function CategoryBadge({ category }: { category?: Category }) {
  return (
    <span className="cat-badge" style={{ "--cat": category?.color ?? "#918df6" } as React.CSSProperties}>
      <CategoryIcon name={category?.name} />
    </span>
  );
}

export function SummaryView({
  summary,
  transactions,
  categories,
  onEdit,
  onAdd,
  onSeeAll,
}: {
  summary: Summary;
  transactions: Transaction[];
  categories: Category[];
  onEdit: (tx: Transaction) => void;
  onAdd: () => void;
  onSeeAll: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = summary.slices.find((slice) => slice.id === selectedId) ?? null;
  const toggle = (id: string) => setSelectedId((current) => (current === id ? null : id));
  const empty = transactions.length === 0;

  if (empty) {
    return (
      <section className="empty">
        <div className="empty-art" aria-hidden="true">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="46" fill="none" stroke="#e8e8e8" strokeWidth="18" />
            <circle cx="60" cy="60" r="46" fill="none" stroke="#918df6" strokeWidth="18" strokeDasharray="90 200" transform="rotate(-90 60 60)" strokeLinecap="round" />
          </svg>
        </div>
        <h2>ยังไม่มีรายการเดือนนี้</h2>
        <p>จดรายการแรกเพื่อเริ่มดูว่าเงินไปไหนบ้าง</p>
        <button type="button" className="primary" onClick={onAdd}>จดรายการแรก</button>
      </section>
    );
  }

  return (
    <>
      <section className="hero" aria-labelledby="headline">
        <p className="eyebrow-note">รายจ่ายเดือนนี้</p>
        <h2 id="headline" className="headline">{summary.headline}</h2>
        <Donut slices={summary.slices} total={summary.expenseSatang} selected={selected} onSelect={toggle} />
        <ul className="legend">
          {summary.slices.map((slice) => (
            <li key={slice.id}>
              <button type="button" aria-pressed={selectedId === slice.id} onClick={() => toggle(slice.id)}>
                <span className="dot" style={{ background: slice.color }} />
                {slice.name}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <dl className="totals">
        <div className="stat">
          <dt>รายรับ</dt>
          <dd className="income">{formatBaht(summary.incomeSatang)}</dd>
        </div>
        <div className="stat">
          <dt>รายจ่าย</dt>
          <dd>{formatBaht(summary.expenseSatang)}</dd>
        </div>
        <div className="stat">
          <dt>คงเหลือ</dt>
          <dd>{formatBaht(summary.balanceSatang)}</dd>
        </div>
      </dl>

      {summary.overBudget.map((item) => (
        <p className="notice" key={item.name}>
          <span className="dot" style={{ background: "#ff3e00" }} />
          {item.name}ใช้เกินงบไป {formatBaht(item.overSatang)} บาท ไม่เป็นไรนะ ปรับได้ในหน้างบ
        </p>
      ))}

      <section className="card" aria-labelledby="recent-title">
        <div className="card-head">
          <h2 id="recent-title">ล่าสุด</h2>
          <button type="button" className="link" onClick={onSeeAll}>ดูทั้งหมด</button>
        </div>
        <TransactionList transactions={transactions.slice(0, 5)} categories={categories} onEdit={onEdit} />
      </section>
    </>
  );
}

export function TransactionList({
  transactions,
  categories,
  onEdit,
}: {
  transactions: Transaction[];
  categories: Category[];
  onEdit: (tx: Transaction) => void;
}) {
  return (
    <ul className="tx-list">
      {transactions.map((item) => {
        const category = categories.find((c) => c.id === item.categoryId);
        return (
          <li key={item.id}>
            <button type="button" className="tx" onClick={() => onEdit(item)}>
              <CategoryBadge category={category} />
              <span className="tx-text">
                <span className="tx-title">{item.note || category?.name || "รายการ"}</span>
                <span className="tx-meta">
                  {category?.name ?? ""} · {thaiDateLabel(item.occurredOn)}
                </span>
              </span>
              <span className={item.type === "income" ? "tx-amount income" : "tx-amount"}>
                {item.type === "income" ? "+" : "−"}
                {formatBaht(item.amountSatang)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
