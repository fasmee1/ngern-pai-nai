"use client";

// Accounts with their balances, a "move money" sheet, and the latest transfers.

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteTransfer, saveBanks, saveTransfer } from "@/app/actions";
import type { WalletsData } from "@/lib/load";
import { formatBaht } from "@/lib/summary";
import { thaiDateLabel, todayInBangkok } from "@/lib/dates";
import { MAX_NOTE } from "@/lib/input";
import { accountLogoCode } from "@/lib/banks";
import { IconAdd, IconClose, IconTransfer, IconTrash, IconWallet } from "./icons";
import { BankLogo } from "./bank-logo";
import { BankPicker } from "./bank-picker";
import { AccountPicker } from "./account-picker";

export function WalletsClient({ data }: { data: WalletsData }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [addingBank, setAddingBank] = useState(false);
  const [, startTransition] = useTransition();
  const name = (id: string) => data.accounts.find((a) => a.id === id)?.name ?? "บัญชีที่ลบแล้ว";
  const unassigned = data.balances[""];
  const total = Object.values(data.balances).reduce((a, b) => a + b, 0);

  function remove(id: string) {
    startTransition(async () => {
      await deleteTransfer(id);
      router.refresh();
    });
  }

  return (
    <>
      <section className="card wal-total">
        <span className="wal-label">เงินรวมทุกบัญชี</span>
        <strong className="wal-total-num">{formatBaht(total)} <small>บาท</small></strong>
        <button type="button" className="primary wide" onClick={() => setOpen(true)} disabled={data.accounts.length < 2}>
          <IconTransfer size={18} />
          ย้ายเงินระหว่างบัญชี
        </button>
      </section>

      <section className="card wal-list" aria-label="บัญชีของฉัน">
        <div className="wal-head">
          <h2>บัญชีของฉัน</h2>
          <button type="button" className="link more" onClick={() => setAddingBank(true)}>
            <IconAdd size={16} />
            เพิ่มธนาคาร
          </button>
        </div>
        <ul>
          {data.accounts.map((a) => {
            const balance = data.balances[a.id] ?? 0;
            return (
              <li key={a.id}>
                <BankLogo code={accountLogoCode(a)} size={40} />
                <span className="wal-name">{a.name}</span>
                <strong className={balance < 0 ? "wal-amount neg" : "wal-amount"}>{formatBaht(balance)}</strong>
              </li>
            );
          })}
          {unassigned !== undefined ? (
            <li>
              <span className="wal-icon"><IconWallet size={18} /></span>
              <span className="wal-name">ยังไม่ระบุบัญชี</span>
              <strong className={unassigned < 0 ? "wal-amount neg" : "wal-amount"}>{formatBaht(unassigned)}</strong>
            </li>
          ) : null}
        </ul>
      </section>

      <section className="card wal-list" aria-label="ประวัติการย้ายเงิน">
        <h2>ย้ายเงินล่าสุด</h2>
        {data.transfers.length === 0 ? (
          <p className="wal-empty">ยังไม่เคยย้ายเงิน</p>
        ) : (
          <ul>
            {data.transfers.map((t) => (
              <li key={t.id}>
                <span className="wal-icon"><IconTransfer size={18} /></span>
                <span className="wal-text">
                  <span className="wal-name">{name(t.fromId)} → {name(t.toId)}</span>
                  <span className="wal-meta">{thaiDateLabel(t.occurredOn)}{t.note ? ` · ${t.note}` : ""}</span>
                </span>
                <strong className="wal-amount">{formatBaht(t.amountSatang)}</strong>
                <button type="button" className="icon-btn small" aria-label="ลบรายการย้ายเงินนี้" onClick={() => remove(t.id)}>
                  <IconTrash size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {addingBank ? (
        <AddBankSheet
          have={data.accounts.map((a) => accountLogoCode(a) ?? "")}
          onClose={() => setAddingBank(false)}
          onSaved={() => { setAddingBank(false); router.refresh(); }}
        />
      ) : null}

      {open ? <TransferSheet data={data} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); router.refresh(); }} /> : null}
    </>
  );
}

function TransferSheet({ data, onClose, onSaved }: { data: WalletsData; onClose: () => void; onSaved: () => void }) {
  const [state, action, pending] = useActionState(saveTransfer, null);
  const [from, setFrom] = useState(data.accounts[0]?.id ?? "");
  const [to, setTo] = useState(data.accounts[1]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayInBangkok());
  const [note, setNote] = useState("");

  const done = state?.ok === true;
  useEffect(() => {
    if (done) onSaved();
  }, [done, onSaved]);

  function swap() {
    setFrom(to);
    setTo(from);
  }

  return (
    <div className="sheet-layer" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet glass" role="dialog" aria-modal="true" aria-labelledby="transfer-title">
        <div className="sheet-head">
          <h2 id="transfer-title">ย้ายเงิน</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="ปิด"><IconClose size={20} /></button>
        </div>

        <form action={action} className="sheet-form">
          <input type="hidden" name="fromAccountId" value={from} />
          <input type="hidden" name="toAccountId" value={to} />
          <AccountPicker label="จากบัญชี" accounts={data.accounts} value={from} onChange={setFrom} />
          <button type="button" className="ghost swap-btn" onClick={swap}>
            <IconTransfer size={16} />
            สลับบัญชี
          </button>
          <AccountPicker label="เข้าบัญชี" accounts={data.accounts} value={to} onChange={setTo} />

          <label className="field">
            <span>จำนวนเงิน (บาท)</span>
            <input name="amount" inputMode="decimal" autoComplete="off" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} required autoFocus />
          </label>

          <label className="field">
            <span>วันที่</span>
            <input name="occurredOn" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>

          <label className="field">
            <span>โน้ต (ไม่บังคับ)</span>
            <input name="note" maxLength={MAX_NOTE} value={note} onChange={(e) => setNote(e.target.value)} placeholder="เช่น ฝากเข้าธนาคาร" />
          </label>

          {from === to ? <p className="form-error" role="alert">เลือกบัญชีต้นทางกับปลายทางคนละบัญชีนะ</p> : null}
          {state && !state.ok ? <p className="form-error" role="alert">{state.error}</p> : null}

          <button type="submit" className="primary wide" disabled={pending || from === to}>
            {pending ? "กำลังย้าย..." : "ย้ายเงิน"}
          </button>
        </form>
      </div>
    </div>
  );
}

function AddBankSheet({ have, onClose, onSaved }: { have: string[]; onClose: () => void; onSaved: () => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save(codes: string[]) {
    setError(null);
    startTransition(async () => {
      const result = await saveBanks(codes);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSaved();
    });
  }

  return (
    <div className="sheet-layer" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet glass" role="dialog" aria-modal="true" aria-labelledby="bank-title">
        <div className="sheet-head">
          <h2 id="bank-title">เพิ่มธนาคาร</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="ปิด"><IconClose size={20} /></button>
        </div>
        <BankPicker exclude={have} pending={pending} error={error} confirmLabel="เพิ่มบัญชี" onConfirm={save} />
      </div>
    </div>
  );
}
