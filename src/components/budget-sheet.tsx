"use client";

import { useState, useTransition } from "react";
import { saveBudget } from "@/app/actions";
import type { Category } from "@/lib/summary";

export function BudgetSheet({
  month,
  categories,
  onClose,
  onSaved,
}: {
  month: string;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      categories.map((c) => [c.id, c.budgetSatang !== undefined ? String(c.budgetSatang / 100) : ""]),
    ),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const results = await Promise.all(
        categories.map((c) => saveBudget(c.id, month, values[c.id] ?? "")),
      );
      const failed = results.find((r) => !r.ok);
      if (failed && !failed.ok) {
        setError(failed.error);
        return;
      }
      onSaved();
    });
  }

  return (
    <div className="sheet-layer" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet glass" role="dialog" aria-modal="true" aria-labelledby="budget-title">
        <div className="sheet-head">
          <h2 id="budget-title">ตั้งงบเดือนนี้</h2>
          <button type="button" className="link" onClick={onClose}>ปิด</button>
        </div>
        <p className="sheet-hint">เว้นว่างไว้ถ้าไม่อยากตั้งงบหมวดนั้น</p>

        <ul className="budget-list">
          {categories.map((c) => (
            <li key={c.id}>
              <label>
                <span className="budget-name">
                  <span className="dot" style={{ background: c.color }} />
                  {c.name}
                </span>
                <span className="budget-input">
                  <input
                    inputMode="decimal"
                    placeholder="ไม่ตั้ง"
                    value={values[c.id] ?? ""}
                    onChange={(e) => setValues((prev) => ({ ...prev, [c.id]: e.target.value }))}
                  />
                  <span>บาท</span>
                </span>
              </label>
            </li>
          ))}
        </ul>

        {error ? <p className="form-error" role="alert">{error}</p> : null}

        <button type="button" className="primary wide" onClick={save} disabled={pending}>
          {pending ? "กำลังบันทึก..." : "บันทึกงบ"}
        </button>
      </div>
    </div>
  );
}
