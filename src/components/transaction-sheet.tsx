"use client";

import { useActionState, useEffect, useState } from "react";
import { addCategory, saveTransaction } from "@/app/actions";
import type { Account } from "@/lib/load";
import type { Transaction } from "@/lib/summary";
import { todayInBangkok } from "@/lib/dates";
import { MAX_NOTE } from "@/lib/input";

type CategoryRow = { id: string; name: string; type: "income" | "expense"; color: string };

export function TransactionSheet({
  categories,
  accounts,
  editing,
  onClose,
  onSaved,
  onDelete,
  onCategoryAdded,
}: {
  categories: CategoryRow[];
  accounts: Account[];
  editing: Transaction | null;
  onClose: () => void;
  onSaved: () => void;
  onDelete?: () => void;
  onCategoryAdded: () => void;
}) {
  const [state, action, pending] = useActionState(saveTransaction, null);
  const [type, setType] = useState<"income" | "expense">(editing?.type ?? "expense");
  const [categoryId, setCategoryId] = useState(editing?.categoryId ?? "");
  const [accountId, setAccountId] = useState(editing?.accountId ?? accounts[0]?.id ?? "");
  const [amount, setAmount] = useState(editing ? String(editing.amountSatang / 100) : "");
  const [note, setNote] = useState(editing?.note ?? "");
  const [date, setDate] = useState(editing?.occurredOn ?? todayInBangkok());

  const choices = categories.filter((c) => c.type === type);

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [addPending, setAddPending] = useState(false);

  async function addNewCategory() {
    setAddError(null);
    setAddPending(true);
    const result = await addCategory(newName, type);
    setAddPending(false);
    if (!result.ok) {
      setAddError(result.error);
      return;
    }
    setCategoryId(result.id);
    setNewName("");
    setAdding(false);
    onCategoryAdded();
  }
  const done = state?.ok === true;
  useEffect(() => {
    if (done) onSaved();
  }, [done, onSaved]);

  return (
    <div className="sheet-layer" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet glass" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <div className="sheet-head">
          <h2 id="sheet-title">{editing ? "แก้ไขรายการ" : "จดรายการ"}</h2>
          <button type="button" className="link" onClick={onClose}>ปิด</button>
        </div>

        <form action={action} className="sheet-form">
          {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="categoryId" value={categoryId} />
          <input type="hidden" name="accountId" value={accountId} />

          <div className="segmented" role="group" aria-label="ประเภท">
            <button type="button" aria-pressed={type === "expense"} onClick={() => { setType("expense"); setCategoryId(""); }}>รายจ่าย</button>
            <button type="button" aria-pressed={type === "income"} onClick={() => { setType("income"); setCategoryId(""); }}>รายรับ</button>
          </div>

          <label className="field">
            <span>จำนวนเงิน (บาท)</span>
            <input name="amount" inputMode="decimal" autoComplete="off" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} required autoFocus />
          </label>

          <div className="field">
            <span>หมวด</span>
            <div className="chips" role="radiogroup" aria-label="หมวด">
              {choices.map((c) => (
                <button key={c.id} type="button" role="radio" aria-checked={categoryId === c.id} className="chip" onClick={() => setCategoryId(c.id)}>
                  <span className="dot" style={{ background: c.color }} />
                  {c.name}
                </button>
              ))}
              <button type="button" className="chip add-chip" onClick={() => setAdding((v) => !v)} aria-expanded={adding}>
                + หมวดใหม่
              </button>
            </div>
            {adding ? (
              <div className="new-category">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="ชื่อหมวด เช่น ค่าขนม"
                  maxLength={40}
                  aria-label="ชื่อหมวดใหม่"
                />
                <button type="button" className="primary" disabled={addPending} onClick={addNewCategory}>
                  {addPending ? "กำลังเพิ่ม..." : "เพิ่ม"}
                </button>
                {addError ? <p className="form-error" role="alert">{addError}</p> : null}
              </div>
            ) : null}
          </div>

          <label className="field">
            <span>บัญชี</span>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>วันที่</span>
            <input name="occurredOn" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>

          <label className="field">
            <span>โน้ต (ไม่บังคับ)</span>
            <input name="note" maxLength={MAX_NOTE} value={note} onChange={(e) => setNote(e.target.value)} placeholder="เช่น ข้าวเที่ยง" />
          </label>

          {state && !state.ok ? <p className="form-error" role="alert">{state.error}</p> : null}

          <button type="submit" className="primary wide" disabled={pending || !categoryId}>
            {pending ? "กำลังบันทึก..." : !categoryId ? "เลือกหมวดก่อนนะ" : "บันทึก"}
          </button>

          {onDelete ? (
            <button type="button" className="ghost wide" onClick={onDelete}>ลบรายการนี้</button>
          ) : null}
        </form>
      </div>
    </div>
  );
}
