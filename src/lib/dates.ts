// Dates are shown and counted in Thailand time, whatever the server clock says.
const TZ = "Asia/Bangkok";

export function todayInBangkok(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function monthStart(today: string): string {
  return `${today.slice(0, 7)}-01`;
}

export function monthEnd(monthStartIso: string): string {
  const [y, m] = monthStartIso.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${monthStartIso.slice(0, 7)}-${String(last).padStart(2, "0")}`;
}

// First day of the month before the given month start.
export function previousMonthStart(monthStartIso: string): string {
  const [y, m] = monthStartIso.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export function thaiMonthLabel(monthStartIso: string): string {
  const [y, m] = monthStartIso.split("-").map(Number);
  const name = new Intl.DateTimeFormat("th-TH", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1)));
  return `${name} ${y + 543}`;
}

// Short label such as "ต.ค. 69".
export function thaiMonthShort(monthStartIso: string): string {
  const [y, m] = monthStartIso.split("-").map(Number);
  const name = new Intl.DateTimeFormat("th-TH", { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1)));
  return `${name} ${String((y + 543) % 100).padStart(2, "0")}`;
}

// The n month starts before the given one, newest first.
export function monthsBefore(monthStartIso: string, n: number): string[] {
  const out: string[] = [];
  let cur = monthStartIso;
  for (let i = 0; i < n; i++) {
    cur = previousMonthStart(cur);
    out.push(cur);
  }
  return out;
}

export function thaiDateLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}

// Days left in the month, counting today.
export function daysLeftInMonth(today: string): number {
  const last = Number(monthEnd(monthStart(today)).slice(8, 10));
  return last - Number(today.slice(8, 10)) + 1;
}

// First day of the month after the given month start.
export function nextMonthStart(monthStartIso: string): string {
  const [y, m] = monthStartIso.split("-").map(Number);
  const d = new Date(Date.UTC(y, m, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

// The month to show from a "YYYY-MM" address parameter. Anything odd, in the future or very old shows this month.
export function parseMonthParam(raw: string | undefined, today: string): string {
  const current = monthStart(today);
  if (!raw || !/^\d{4}-(0[1-9]|1[0-2])$/.test(raw)) return current;
  const picked = `${raw}-01`;
  if (picked > current || picked < "2020-01-01") return current;
  return picked;
}
