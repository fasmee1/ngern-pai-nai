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

export function thaiMonthLabel(monthStartIso: string): string {
  const [y, m] = monthStartIso.split("-").map(Number);
  const name = new Intl.DateTimeFormat("th-TH", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1)));
  return `${name} ${y + 543}`;
}

export function thaiDateLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}
