"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

// Starts the Google sign-in flow. Google returns to /auth/callback.
export function SignInButton() {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function start() {
    setBusy(true);
    setFailed(false);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setFailed(true);
      setBusy(false);
    }
  }

  return (
    <div className="signin-action">
      <button type="button" className="primary wide" onClick={start} disabled={busy}>
        {busy ? "กำลังพาไปหน้า Google..." : "เข้าระบบด้วย Google"}
      </button>
      {failed ? <p className="signin-note" role="alert">เข้าระบบไม่สำเร็จ ลองอีกครั้งนะ</p> : null}
    </div>
  );
}
