// Thai banks people can pick as their accounts. The code is stored with the account; the name is shown.

export type Bank = { code: string; name: string; short: string; color: string };

export const BANKS: Bank[] = [
  { code: "kbank", name: "ธนาคารกสิกรไทย", short: "KBank", color: "#138f2d" },
  { code: "scb", name: "ธนาคารไทยพาณิชย์", short: "SCB", color: "#4e2e7f" },
  { code: "bbl", name: "ธนาคารกรุงเทพ", short: "BBL", color: "#1e4598" },
  { code: "ktb", name: "ธนาคารกรุงไทย", short: "KTB", color: "#1ba5e0" },
  { code: "bay", name: "ธนาคารกรุงศรีอยุธยา", short: "Krungsri", color: "#d9a000" },
  { code: "ttb", name: "ธนาคารทหารไทยธนชาต (ttb)", short: "ttb", color: "#e8590c" },
  { code: "gsb", name: "ธนาคารออมสิน", short: "GSB", color: "#eb198d" },
  { code: "baac", name: "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (ธ.ก.ส.)", short: "BAAC", color: "#4b9b1d" },
  { code: "ghb", name: "ธนาคารอาคารสงเคราะห์ (ธอส.)", short: "GHB", color: "#f57d23" },
  { code: "cimb", name: "ธนาคารซีไอเอ็มบี ไทย", short: "CIMB", color: "#7e2f36" },
  { code: "uob", name: "ธนาคารยูโอบี", short: "UOB", color: "#0b3979" },
  { code: "lhb", name: "ธนาคารแลนด์ แอนด์ เฮ้าส์", short: "LH Bank", color: "#6d6e71" },
  { code: "tisco", name: "ธนาคารทิสโก้", short: "TISCO", color: "#12549f" },
  { code: "kkp", name: "ธนาคารเกียรตินาคินภัทร", short: "KKP", color: "#199cc5" },
  { code: "icbc", name: "ธนาคารไอซีบีซี (ไทย)", short: "ICBC", color: "#c50f1c" },
  { code: "ibank", name: "ธนาคารอิสลามแห่งประเทศไทย", short: "iBank", color: "#00873c" },
  { code: "smebank", name: "ธนาคารพัฒนาวิสาหกิจขนาดกลางและขนาดย่อมฯ (SME D Bank)", short: "SME D", color: "#f58220" },
  { code: "tcrb", name: "ธนาคารไทยเครดิต", short: "Thai Credit", color: "#00a0e1" },
  { code: "citi", name: "ธนาคารซิตี้แบงก์", short: "Citi", color: "#0a5bb8" },
  { code: "hsbc", name: "ธนาคารเอชเอสบีซี", short: "HSBC", color: "#db0011" },
  { code: "exim", name: "ธนาคารเพื่อการส่งออกและนำเข้าแห่งประเทศไทย (EXIM)", short: "EXIM", color: "#0b3b8c" },
  { code: "promptpay", name: "พร้อมเพย์", short: "PromptPay", color: "#1a4f8b" },
  { code: "truemoney", name: "ทรูมันนี่ วอลเล็ต", short: "TrueMoney", color: "#f7941d" },
];

// Banks that have a logo file in public/banks/<code>.png. The rest get a colored badge.
const LOGO_CODES = new Set(["kbank", "scb", "bbl", "ktb", "bay", "ttb", "gsb", "baac", "ghb", "cimb", "uob", "lhb", "tisco", "kkp", "icbc", "ibank", "tcrb", "citi", "hsbc", "promptpay", "truemoney"]);

export function logoPath(code: string): string | null {
  return LOGO_CODES.has(code) ? `/banks/${code}.png` : null;
}

// Logo code for an account. Accounts made before banks existed are matched by name.
export function accountLogoCode(account: { name: string; bankCode?: string | null }): string | null {
  if (account.bankCode) return account.bankCode;
  return BANKS.find((b) => b.name === account.name)?.code ?? null;
}

export function bankByCode(code: string | null | undefined): Bank | undefined {
  return BANKS.find((b) => b.code === code);
}

// Keeps only known, non-repeated bank codes, in the order given.
export function parseBankCodes(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const known = new Set(BANKS.map((b) => b.code));
  const out: string[] = [];
  for (const item of input) {
    if (typeof item === "string" && known.has(item) && !out.includes(item)) out.push(item);
  }
  return out;
}
