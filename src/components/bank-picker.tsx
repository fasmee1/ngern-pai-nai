"use client";

// Grid of banks to tick. Used on first sign-in and when adding banks later.

import { useState } from "react";
import { BANKS } from "@/lib/banks";
import { BankLogo } from "./bank-logo";

export function BankPicker({
  exclude = [],
  pending,
  error,
  confirmLabel,
  onConfirm,
}: {
  // Bank codes already added; they are not shown again.
  exclude?: string[];
  pending: boolean;
  error: string | null;
  confirmLabel: string;
  onConfirm: (codes: string[]) => void;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  const shown = BANKS.filter((b) => !exclude.includes(b.code)).filter(
    (b) => !query.trim() || `${b.name} ${b.short}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  function toggle(code: string) {
    setPicked((cur) => (cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code]));
  }

  return (
    <div className="bank-picker">
      <input
        className="bank-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="ค้นหาธนาคาร"
        aria-label="ค้นหาธนาคาร"
      />
      <ul className="bank-grid">
        {shown.map((b) => {
          const on = picked.includes(b.code);
          return (
            <li key={b.code}>
              <button type="button" className="bank-card" aria-pressed={on} onClick={() => toggle(b.code)}>
                <BankLogo code={b.code} size={44} />
                <span className="bank-card-name">{b.name}</span>
                <span className="bank-check" aria-hidden="true">{on ? "✓" : ""}</span>
              </button>
            </li>
          );
        })}
        {shown.length === 0 ? <li className="bank-none">ไม่พบธนาคารที่ค้นหา</li> : null}
      </ul>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button type="button" className="primary wide" disabled={pending || picked.length === 0} onClick={() => onConfirm(picked)}>
        {pending ? "กำลังบันทึก..." : picked.length === 0 ? "เลือกธนาคารก่อนนะ" : `${confirmLabel} (${picked.length})`}
      </button>
    </div>
  );
}
