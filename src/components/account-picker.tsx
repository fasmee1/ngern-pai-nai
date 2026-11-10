"use client";

// Pick an account by tapping its logo chip. Works like a radio group.

import { accountLogoCode } from "@/lib/banks";
import type { Account } from "@/lib/load";
import { BankLogo } from "./bank-logo";

export function AccountPicker({
  label,
  accounts,
  value,
  onChange,
}: {
  label: string;
  accounts: Account[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="field">
      <span>{label}</span>
      <div className="acct-chips" role="radiogroup" aria-label={label}>
        {accounts.map((a) => (
          <button key={a.id} type="button" role="radio" aria-checked={value === a.id} className="acct-chip" onClick={() => onChange(a.id)}>
            <BankLogo code={accountLogoCode(a)} size={28} />
            <span>{a.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
