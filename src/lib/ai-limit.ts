import "server-only";

// One shared daily allowance for everything that calls Gemini (chat, typed entries, reading aloud).
// The count lives in the database (take_ai_use) so it survives restarts and cannot be reset from the browser.

import type { SupabaseClient } from "@supabase/supabase-js";

export const AI_DAILY_LIMIT = 60;

export const AI_LIMIT_MESSAGE = `วันนี้ใช้ AI ครบ ${AI_DAILY_LIMIT} ครั้งแล้ว พรุ่งนี้ใช้ได้ใหม่นะ ส่วนการจดรายการปกติยังใช้ได้เหมือนเดิม`;
export const AI_LIMIT_ERROR = "ตรวจจำนวนการใช้ AI ไม่ได้ตอนนี้ ลองอีกครั้งนะ";

// Takes one use. Anything other than a clear "yes" from the database is a no, so a broken check never means free use.
export async function takeAiUse(supabase: SupabaseClient): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await supabase.rpc("take_ai_use", { max_per_day: AI_DAILY_LIMIT });
  if (error) return { ok: false, error: AI_LIMIT_ERROR };
  return data === true ? { ok: true } : { ok: false, error: AI_LIMIT_MESSAGE };
}
