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
