"use client";

// Savings goals and monthly bills. Goals are tracked by hand; a bill is a reminder with a one-tap "write it down".

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addBill, addGoal, deleteBill, deleteGoal, depositGoal, payBill } from "@/app/actions";
import type { PlansData } from "@/lib/load";
import { billState, goalPercent, monthlyNeeded } from "@/lib/plans";
import { formatBaht } from "@/lib/summary";
import { thaiDateLabel, todayInBangkok } from "@/lib/dates";
import { IconAdd, IconBudget, IconClose, IconTrash } from "./icons";
import { AccountPicker } from "./account-picker";

export function PlansClient({ data }: { data: PlansData }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [sheet, setSheet] = useState<"goal" | "bill" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [depositFor, setDepositFor] = useState<string | null>(null);
  const [depositText, setDepositText] = useState("");
  const today = todayInBangkok();

  // Runs one action, shows its error, and refreshes the page when it worked.
  function run(job: () => Promise<{ ok: true } | { ok: false; error: string }>, after?: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await job();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      after?.();
      router.refresh();
    });
  }

  return (
    <>
      {error ? <p className="form-error" role="alert">{error}</p> : null}

      <section className="card wal-list" aria-label="เป้าหมายออมเงิน">
        <div className="wal-head">
          <h2>เป้าหมายออมเงิน</h2>
          <button type="button" className="link more" onClick={() => setSheet("goal")}>
            <IconAdd size={16} />
            ตั้งเป้าหมาย
          </button>
        </div>
        {data.goals.length === 0 ? (
          <p className="wal-empty">ยังไม่มีเป้าหมาย ลองตั้งเป้า เช่น เก็บเงินเที่ยว 20,000 บาท</p>
        ) : (
          <ul>
            {data.goals.map((g) => {
              const percent = goalPercent(g.savedSatang, g.targetSatang);
              const need = monthlyNeeded(g, today);
              return (
                <li key={g.id} className="plan-item">
                  <span className="wal-icon"><IconBudget size={18} /></span>
                  <span className="wal-text">
                    <span className="wal-name">{g.name}</span>
                    <span className="plan-bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={`${g.name} ${percent}%`}>
                      <span style={{ width: `${percent}%` }} />
                    </span>
                    <span className="wal-meta">
                      {formatBaht(g.savedSatang)} จาก {formatBaht(g.targetSatang)} บาท ({percent}%)
                      {g.deadline ? ` · ครบ ${thaiDateLabel(g.deadline)}` : ""}
                      {need ? ` · ต้องเก็บเดือนละ ${formatBaht(need)}` : ""}
                      {percent >= 100 ? " · ถึงเป้าแล้ว" : ""}
                    </span>
                    {depositFor === g.id ? (
                      <span className="plan-deposit">
                        <input
                          inputMode="decimal"
                          autoComplete="off"
                          placeholder="เก็บเพิ่มกี่บาท"
                          value={depositText}
                          onChange={(e) => setDepositText(e.target.value)}
                          aria-label="จำนวนเงินที่เก็บเพิ่ม"
                          autoFocus
                        />
                        <button
                          type="button"
                          className="primary"
                          onClick={() => run(() => depositGoal(g.id, depositText), () => { setDepositFor(null); setDepositText(""); })}
                        >
                          เก็บ
                        </button>
                      </span>
                    ) : (
                      <button type="button" className="link more" onClick={() => { setDepositFor(g.id); setDepositText(""); }}>
                        + เก็บเพิ่ม
                      </button>
                    )}
                  </span>
                  <button type="button" className="icon-btn small" aria-label={`ลบเป้าหมาย ${g.name}`} onClick={() => run(() => deleteGoal(g.id))}>
                    <IconTrash size={16} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card wal-list" aria-label="บิลประจำเดือน">
        <div className="wal-head">
          <h2>บิลประจำเดือน</h2>
          <button type="button" className="link more" onClick={() => setSheet("bill")}>
            <IconAdd size={16} />
            เพิ่มบิล
          </button>
        </div>
        {data.bills.length === 0 ? (
          <p className="wal-empty">ยังไม่มีบิล ลองเพิ่ม เช่น ค่าเน็ต ค่าห้อง ค่าผ่อน</p>
        ) : (
          <ul>
            {data.bills.map((b) => {
              const state = billState(b, today);
              return (
                <li key={b.id} className="plan-item">
                  <span className="wal-icon">{b.dueDay}</span>
                  <span className="wal-text">
                    <span className="wal-name">{b.name}</span>
                    <span className="wal-meta">
                      {formatBaht(b.amountSatang)} บาท · ทุกวันที่ {b.dueDay}
                      {state.kind === "paid" ? " · จดแล้วเดือนนี้" : ""}
                      {state.kind === "soon" ? ` · อีก ${state.inDays} วัน` : ""}
                      {state.kind === "due" ? (state.lateDays === 0 ? " · ถึงกำหนดวันนี้" : ` · เลยกำหนด ${state.lateDays} วัน`) : ""}
                    </span>
                  </span>
                  {state.kind === "paid" ? null : (
                    <button type="button" className="primary small" onClick={() => run(() => payBill(b.id))}>
                      จดว่าจ่ายแล้ว
                    </button>
                  )}
                  <button type="button" className="icon-btn small" aria-label={`ลบบิล ${b.name}`} onClick={() => run(() => deleteBill(b.id))}>
                    <IconTrash size={16} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <p className="wal-meta">ปุ่มจดว่าจ่ายแล้ว แค่จดเป็นรายจ่ายของวันนี้ ไม่ได้โอนเงินจริง</p>
      </section>

      {sheet === "goal" ? <GoalSheet onClose={() => setSheet(null)} onSaved={() => { setSheet(null); router.refresh(); }} /> : null}
      {sheet === "bill" ? <BillSheet data={data} onClose={() => setSheet(null)} onSaved={() => { setSheet(null); router.refresh(); }} /> : null}
    </>
  );
}

function GoalSheet({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await addGoal(name, target, deadline);
      if (!result.ok) setError(result.error);
      else onSaved();
    });
  }

  return (
    <div className="sheet-layer" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet glass" role="dialog" aria-modal="true" aria-labelledby="goal-title">
        <div className="sheet-head">
          <h2 id="goal-title">ตั้งเป้าหมายออมเงิน</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="ปิด"><IconClose size={20} /></button>
        </div>
        <div className="sheet-form">
          <label className="field">
            <span>ชื่อเป้าหมาย</span>
            <input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="เช่น เก็บเงินเที่ยวญี่ปุ่น" autoFocus />
          </label>
          <label className="field">
            <span>เป้าหมาย (บาท)</span>
            <input inputMode="decimal" autoComplete="off" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="50000" />
          </label>
          <label className="field">
            <span>อยากได้ภายใน (ไม่บังคับ)</span>
            <input type="date" value={deadline} min={todayInBangkok()} onChange={(e) => setDeadline(e.target.value)} />
          </label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button type="button" className="primary wide" disabled={pending || !name.trim() || !target.trim()} onClick={save}>
            {pending ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BillSheet({ data, onClose, onSaved }: { data: PlansData; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [day, setDay] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState(data.accounts[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await addBill(name, amount, day, categoryId, accountId);
      if (!result.ok) setError(result.error);
      else onSaved();
    });
  }

  return (
    <div className="sheet-layer" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet glass" role="dialog" aria-modal="true" aria-labelledby="bill-title">
        <div className="sheet-head">
          <h2 id="bill-title">เพิ่มบิลประจำเดือน</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="ปิด"><IconClose size={20} /></button>
        </div>
        <div className="sheet-form">
          <label className="field">
            <span>ชื่อบิล</span>
            <input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="เช่น ค่าเน็ต" autoFocus />
          </label>
          <label className="field">
            <span>จำนวนเงิน (บาท)</span>
            <input inputMode="decimal" autoComplete="off" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="599" />
          </label>
          <label className="field">
            <span>ครบกำหนดทุกวันที่ (1 ถึง 28)</span>
            <input inputMode="numeric" autoComplete="off" value={day} onChange={(e) => setDay(e.target.value)} placeholder="15" />
          </label>
          <div className="field">
            <span>หมวด</span>
            <div className="chips" role="radiogroup" aria-label="หมวด">
              {data.categories.map((c) => (
                <button key={c.id} type="button" role="radio" aria-checked={categoryId === c.id} className="chip" onClick={() => setCategoryId(c.id)}>
                  <span className="dot" style={{ background: c.color }} />
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          <AccountPicker label="บัญชี" accounts={data.accounts} value={accountId} onChange={setAccountId} />
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button type="button" className="primary wide" disabled={pending || !name.trim() || !amount.trim() || !day.trim() || !categoryId} onClick={save}>
            {pending ? "กำลังบันทึก..." : !categoryId ? "เลือกหมวดก่อนนะ" : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}
