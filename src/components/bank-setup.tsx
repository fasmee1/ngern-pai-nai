"use client";

// Shown once after the first sign-in: which banks does this person use?

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveBanks } from "@/app/actions";
import { BankPicker } from "./bank-picker";

export function BankSetup({ name }: { name: string }) {
  const router = useRouter();
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
      router.refresh();
    });
  }

  return (
    <div className="screen setup-screen">
      <div className="aurora" aria-hidden="true" />
      <main className="page">
        <section className="card setup-card">
          <h1 className="setup-title">สวัสดี {name}</h1>
          <p className="setup-text">เลือกธนาคารที่คุณใช้อยู่ จะได้เลือกบัญชีตอนจดรายการและย้ายเงินได้เลย เงินสดมีให้อยู่แล้ว เพิ่มทีหลังได้ในหน้าบัญชีเงิน</p>
          <BankPicker pending={pending} error={error} confirmLabel="ต่อไป" onConfirm={save} />
          <button type="button" className="ghost wide" disabled={pending} onClick={() => save([])}>ข้ามไปก่อน</button>
        </section>
      </main>
    </div>
  );
}
