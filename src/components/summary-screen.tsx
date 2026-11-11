"use client";

// THESIS: the first thing you see is a sentence about your money, not a table.
// OWN-WORLD: white canvas, sky-to-lavender light, soft cards, pill controls.
// FIRST VIEWPORT: headline, glowing donut, then the three totals.

import { useState } from "react";
import Link from "next/link";
import { formatBaht, todayAllowance, type Category, type Comparison, type FrequentEntry, type Slice, type Summary, type Transaction } from "@/lib/summary";
import { thaiDateLabel } from "@/lib/dates";
import { CategoryIcon, IconChevron, IconTarget, IconTransfer } from "./icons";
import { CompareLine } from "./compare-view";
import type { BillAlert } from "@/lib/load";

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
        <span className="donut-value" data-long={formatBaht(selected ? selected.spentSatang : total).length > 9}>{formatBaht(selected ? selected.spentSatang : total)}</span>
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
  comparison,
  transactions,
  categories,
  onEdit,
  onAdd,
  onSeeAll,
  billAlerts,
  daysLeft,
  spentToday,
  quick,
  onQuick,
}: {
  summary: Summary;
  comparison: Comparison;
  transactions: Transaction[];
  categories: Category[];
  onEdit: (tx: Transaction) => void;
  onAdd: () => void;
  onSeeAll: () => void;
  billAlerts: BillAlert[];
  daysLeft: number;
  spentToday: number;
  quick: FrequentEntry[];
  onQuick: (entry: FrequentEntry) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = summary.slices.find((slice) => slice.id === selectedId) ?? null;
  const toggle = (id: string) => setSelectedId((current) => (current === id ? null : id));
  const empty = transactions.length === 0;
  const today = todayAllowance(summary.balanceSatang, spentToday, daysLeft);
  const usedPercent = summary.incomeSatang > 0 ? Math.round((summary.expenseSatang / summary.incomeSatang) * 100) : 0;

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
      <section className="balance-card" aria-labelledby="balance-title">
        <p id="balance-title" className="bc-label">คงเหลือเดือนนี้</p>
        <p className="bc-amount" data-long={formatBaht(summary.balanceSatang).length > 10}>
          <span>{formatBaht(summary.balanceSatang)}</span>
          <small>บาท</small>
        </p>
        {today !== null ? (
          <div className="bc-day" data-over={today.leftSatang < 0}>
            <p>{today.leftSatang < 0 ? "วันนี้ใช้เกินไปแล้ว" : "วันนี้เหลือใช้ได้"} <strong>{formatBaht(Math.abs(today.leftSatang))}</strong> บาท</p>
            <small>งบวันนี้ {formatBaht(today.budgetSatang)} · ใช้ไปแล้ว {formatBaht(today.spentSatang)} · เหลืออีก {daysLeft} วันในเดือน</small>
          </div>
        ) : null}
        {summary.incomeSatang > 0 ? (
          <>
            <div className="bc-meter" role="img" aria-label={`ใช้ไป ${usedPercent}% ของรายรับ`}>
              <span style={{ width: `${Math.min(100, usedPercent)}%` }} />
            </div>
            <p className="bc-note">{usedPercent > 100 ? "ใช้เกินรายรับเดือนนี้" : `ใช้ไป ${usedPercent}% ของรายรับ`}</p>
          </>
        ) : null}
        <dl className="bc-row">
          <div>
            <dt>รายรับ</dt>
            <dd>{formatBaht(summary.incomeSatang)}</dd>
          </div>
          <div>
            <dt>รายจ่าย</dt>
            <dd>{formatBaht(summary.expenseSatang)}</dd>
          </div>
        </dl>
      </section>

      {billAlerts.length > 0 ? (
        <Link href="/plans" className="bill-alert" aria-label="ดูบิลประจำเดือน">
          <span className="bill-alert-icon"><IconTarget size={18} /></span>
          <span className="bill-alert-text">
            <strong>
              {billAlerts.length === 1 ? billAlerts[0].name : `${billAlerts[0].name} และอีก ${billAlerts.length - 1} บิล`} {billAlerts[0].text}
            </strong>
            <small>รวม {formatBaht(billAlerts.reduce((s, b) => s + b.amountSatang, 0))} บาท · แตะเพื่อดูและจดว่าจ่ายแล้ว</small>
          </span>
          <IconChevron size={16} />
        </Link>
      ) : null}

      {quick.length > 0 ? (
        <section className="quick" aria-label="จดด่วน">
          <p className="quick-title">จดด่วน แตะครั้งเดียวบันทึกเลย</p>
          <div className="quick-row">
            {quick.map((q) => (
              <button key={`${q.note}${q.categoryId}${q.accountId}`} type="button" className="quick-chip" onClick={() => onQuick(q)}>
                <span>{q.note}</span>
                <strong>{formatBaht(q.amountSatang)}</strong>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="card spend" aria-labelledby="headline">
        <h2 id="headline" className="ov-headline">{summary.headline}</h2>
        <div className="spend-body">
          <Donut slices={summary.slices} total={summary.expenseSatang} selected={selected} onSelect={toggle} />
          <ul className="cat-list">
            {summary.slices.map((slice) => (
              <li key={slice.id}>
                <button type="button" aria-pressed={selectedId === slice.id} onClick={() => toggle(slice.id)}>
                  <span className="dot" style={{ background: slice.color }} />
                  <span className="cat-name">{slice.name}</span>
                  <span className="cat-amt">{formatBaht(slice.spentSatang)}</span>
                  <span className="cat-bar" aria-hidden="true"><span style={{ width: `${Math.max(3, Math.round(slice.share * 100))}%`, background: slice.color }} /></span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <nav className="shortcuts" aria-label="ทางลัด">
        <Link href="/plans" className="shortcut">
          <span className="shortcut-icon"><IconTarget size={20} /></span>
          <span className="shortcut-text"><strong>เป้าหมายและบิล</strong><small>ออมเงิน · บิลประจำเดือน</small></span>
        </Link>
        <Link href="/wallets" className="shortcut">
          <span className="shortcut-icon"><IconTransfer size={20} /></span>
          <span className="shortcut-text"><strong>บัญชีเงิน</strong><small>ย้ายเงินระหว่างบัญชี</small></span>
        </Link>
      </nav>

      <CompareLine comparison={comparison} />

      {summary.overBudget.map((item) => (
        <p className="notice" key={item.name}>
          <span className="dot" style={{ background: "#ff3e00" }} />
          {item.name}ใช้เกินงบไป {formatBaht(item.overSatang)} บาท ไม่เป็นไรนะ ปรับได้ในหน้างบ
        </p>
      ))}

      <section className="card" aria-labelledby="recent-title">
        <div className="card-head">
          <h2 id="recent-title">ล่าสุด</h2>
          <button type="button" className="link more" onClick={onSeeAll}>ดูทั้งหมด<IconChevron size={16} /></button>
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
