"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveProfile } from "@/app/actions";
import { AVATAR_COLORS } from "@/lib/input";
import { Avatar } from "./avatar";

export function ProfileCard({
  initialName,
  initialColor,
  email,
  photo = null,
}: {
  initialName: string;
  initialColor: string;
  email: string;
  photo?: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const changed = name.trim() !== initialName.trim() || color !== initialColor;

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await saveProfile(name, color);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="profile">
      <div className="profile-head">
        <Avatar name={name || email} color={color} size={64} photo={photo} />
        <div className="profile-id">
          <p className="profile-name">{name.trim() || "ยังไม่ได้ตั้งชื่อ"}</p>
          <p className="profile-email">{email}</p>
        </div>
      </div>

      <label className="field">
        <span>ชื่อที่แสดง</span>
        <input value={name} maxLength={40} onChange={(e) => { setName(e.target.value); setSaved(false); }} autoComplete="nickname" />
      </label>

      <div className="field">
        <span>{photo ? "สีพื้นหลังเมื่อไม่มีรูป" : "สีรูปโปรไฟล์"}</span>
        <div className="swatches" role="radiogroup" aria-label="สีรูปโปรไฟล์">
          {AVATAR_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={color === c}
              aria-label={`สี ${c}`}
              className="swatch"
              style={{ background: c }}
              onClick={() => { setColor(c); setSaved(false); }}
            />
          ))}
        </div>
      </div>

      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {saved && !changed ? <p className="saved-note" role="status">บันทึกแล้ว</p> : null}

      <button type="button" className="primary wide" onClick={save} disabled={pending || !changed}>
        {pending ? "กำลังบันทึก..." : "บันทึกโปรไฟล์"}
      </button>
    </div>
  );
}
