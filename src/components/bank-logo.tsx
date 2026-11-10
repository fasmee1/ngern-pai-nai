// Bank logo on a rounded tile. Banks without a logo file get a colored badge with the short name.

import Image from "next/image";
import { bankByCode, logoPath } from "@/lib/banks";
import { IconWallet } from "./icons";

export function BankLogo({ code, size = 40 }: { code?: string | null; size?: number }) {
  const bank = code ? bankByCode(code) : undefined;
  const style = { width: size, height: size };

  if (!bank) {
    return (
      <span className="bank-logo plain" style={style} aria-hidden="true">
        <IconWallet size={Math.round(size * 0.5)} />
      </span>
    );
  }

  const src = logoPath(bank.code);
  if (!src) {
    return (
      <span className="bank-logo badge" style={{ ...style, background: bank.color }} aria-hidden="true">
        {bank.short.slice(0, 4)}
      </span>
    );
  }

  return (
    <span className="bank-logo" style={style}>
      <Image src={src} alt="" width={size} height={size} unoptimized />
    </span>
  );
}
