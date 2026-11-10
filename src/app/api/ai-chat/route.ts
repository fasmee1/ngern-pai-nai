import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseChat } from "@/lib/ai-prompt";
import { buildAdvisorSystem } from "@/lib/advisor";
import { streamGemini } from "@/lib/gemini";

// A reply can take a while to write; it is sent as it is written so the screen never waits for all of it.
export const maxDuration = 120;

function fail(error: string, status: number) {
  return Response.json({ error }, { status });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return fail("ยังไม่ได้เข้าระบบ ลองเข้าใหม่นะ", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("ข้อความไม่ถูกต้อง ลองพิมพ์ใหม่นะ", 400);
  }
  const chat = parseChat((body as { history?: unknown } | null)?.history);
  if (!chat) return fail("ข้อความไม่ถูกต้อง ลองพิมพ์ใหม่นะ (ไม่เกิน 500 ตัวอักษร)", 400);

  const system = await buildAdvisorSystem();
  const result = await streamGemini(system, chat);
  if (!result.ok) return fail(result.error, result.status);

  return new Response(result.stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}
