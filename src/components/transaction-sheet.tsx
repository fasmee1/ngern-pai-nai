"use client";
import { useExit } from "./use-exit";
import { IconClose } from "./icons";
import { AccountPicker } from "./account-picker";

import { useActionState, useEffect, useState } from "react";
import { addCategory, parseEntryText, parseReceiptImage, saveTransaction } from "@/app/actions";
import { shrinkImage } from "@/lib/image-shrink";
import type { QuickEntry } from "@/lib/quick-entry";
import type { Account } from "@/lib/load";
import type { Transaction } from "@/lib/summary";
import { todayInBangkok } from "@/lib/dates";
import { MAX_NOTE } from "@/lib/input";
import { MAX_ENTRY_CHARS } from "@/lib/quick-entry";

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

  // "Type a sentence" helper: the AI fills the form, the person checks it and presses save.
  const [sentence, setSentence] = useState("");
  const [aiPending, setAiPending] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  async function fillFromSentence() {
    setAiError(null);
    setAiPending(true);
    const result = await parseEntryText(sentence);
    setAiPending(false);
    if (!result.ok) {
      setAiError(result.error);
      return;
    }
    applyEntry(result.entry);
    setSentence("");
  }

  // Picture of a slip or receipt: shrink it here, then the AI reads it.
  async function fillFromPicture(file: File | undefined) {
    if (!file) return;
    setAiError(null);
    setAiPending(true);
    const picture = await shrinkImage(file);
    if (!picture) {
      setAiPending(false);
      setAiError("เปิดรูปนี้ไม่ได้ ลองรูปอื่นนะ");
      return;
    }
    const result = await parseReceiptImage(picture.mime, picture.base64);
    setAiPending(false);
    if (!result.ok) {
      setAiError(result.error);
      return;
    }
    applyEntry(result.entry);
  }

  function applyEntry(e: QuickEntry) {
    setType(e.type);
    setAmount(e.amount);
    setCategoryId(e.categoryId ?? "");
    setNote(e.note);
    if (e.date) setDate(e.date);
    if (!e.categoryId) setAiError("เลือกหมวดเองอีกนิดนะ AI ยังเดาหมวดไม่ได้");
  }

  const done = state?.ok === true;
  useEffect(() => {
    if (done) onSaved();
  }, [done, onSaved]);

  const [closing, close] = useExit(onClose);

  return (
    <div className={closing ? "sheet-layer closing" : "sheet-layer"} role="presentation" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="sheet glass" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <div className="sheet-head">
          <h2 id="sheet-title">{editing ? "แก้ไขรายการ" : "จดรายการ"}</h2>
          <button type="button" className="icon-btn" onClick={close} aria-label="ปิด"><IconClose size={20} /></button>
        </div>

        <form action={action} className="sheet-form">
          {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="categoryId" value={categoryId} />
          <input type="hidden" name="accountId" value={accountId} />

          {editing ? null : (
            <div className="field ai-quickadd">
              <span>พิมพ์สั้น ๆ ให้ AI กรอกให้</span>
              <div className="new-category">
                <input
                  value={sentence}
                  onChange={(e) => setSentence(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (sentence.trim() && !aiPending) void fillFromSentence();
                    }
                  }}
                  maxLength={MAX_ENTRY_CHARS}
                  placeholder="เช่น กินข้าว 60 หรือ เมื่อวานค่าแท็กซี่ 120"
                  aria-label="พิมพ์รายการให้ AI กรอกให้"
                  autoComplete="off"
                />
                <button type="button" className="primary" disabled={aiPending || !sentence.trim()} onClick={() => void fillFromSentence()}>
                  {aiPending ? "กำลังอ่าน..." : "กรอกให้"}
                </button>
              </div>
              <label className={aiPending ? "ghost wide icon-button receipt-btn disabled" : "ghost wide icon-button receipt-btn"}>
                ถ่ายรูปหรือเลือกรูปสลิปให้ AI อ่าน
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={aiPending}
                  onChange={(e) => {
                    void fillFromPicture(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
              <p className="hint">รูปถูกส่งให้ AI อ่านครั้งเดียวและแอปไม่เก็บรูปไว้ ตรวจยอดก่อนกดบันทึกทุกครั้ง</p>
              {aiError ? <p className="form-error" role="alert">{aiError}</p> : null}
            </div>
          )}

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

          <AccountPicker label="บัญชี" accounts={accounts} value={accountId} onChange={setAccountId} />

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
