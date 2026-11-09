"use client";

import { useState, useTransition } from "react";
import { deleteMyAccount } from "@/app/actions";

export function DeleteAccount() {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await deleteMyAccount(text);
      // On success the action redirects, so we only land here on failure.
      if (result && !result.ok) setError(result.error);
    });
  }

  return (
    <div className="danger">
      <label className="field">
        <span>พิมพ์คำว่า ลบ เพื่อยืนยัน</span>
        <input value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" />
      </label>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button type="button" className="ghost wide danger-button" disabled={pending || text.trim() !== "ลบ"} onClick={remove}>
        {pending ? "กำลังลบ..." : "ลบบัญชีและข้อมูลทั้งหมด"}
      </button>
    </div>
  );
}
