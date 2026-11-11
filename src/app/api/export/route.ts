import { createSupabaseServerClient } from "@/lib/supabase/server";
import { allRows } from "@/lib/load";
import { toCsv, type CsvRow } from "@/lib/csv";
import { todayInBangkok } from "@/lib/dates";

// Every transaction of the signed-in person as a spreadsheet file. Row-level security limits it to their own rows.
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return Response.json({ error: "ยังไม่ได้เข้าระบบ" }, { status: 401 });

  const [categories, accounts, rows] = await Promise.all([
    supabase.from("categories").select("id, name"),
    supabase.from("accounts").select("id, name"),
    allRows((from, to) =>
      supabase
        .from("transactions")
        .select("id, type, category_id, account_id, amount_satang, occurred_on, note")
        .is("deleted_at", null)
        .order("occurred_on", { ascending: false })
        .order("id")
        .range(from, to),
    ),
  ]);

  const categoryName = new Map((categories.data ?? []).map((c) => [c.id, c.name]));
  const accountName = new Map((accounts.data ?? []).map((a) => [a.id, a.name]));
  const csv: CsvRow[] = rows.map((r) => ({
    date: r.occurred_on,
    type: r.type as "income" | "expense",
    category: categoryName.get(r.category_id ?? "") ?? "",
    account: accountName.get(r.account_id ?? "") ?? "",
    amountSatang: Number(r.amount_satang),
    note: r.note ?? "",
  }));

  return new Response(toCsv(csv), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ngern-pai-nai-${todayInBangkok()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
