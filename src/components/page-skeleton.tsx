import Link from "next/link";
import { IconBack } from "./icons";

// Shown at once while a sub-page loads, so tapping a link feels instant.
export function PageSkeleton({ title, cards = 3 }: { title: string; cards?: number }) {
  return (
    <div className="screen" aria-busy="true">
      <div className="aurora" aria-hidden="true" />
      <header className="topbar">
        <Link href="/" className="icon-btn" aria-label="กลับ"><IconBack size={20} /></Link>
        <span className="brand">{title}</span>
      </header>
      <main className="page" aria-label="กำลังโหลด">
        {Array.from({ length: cards }, (_, i) => (
          <div key={i} className="glass page-card skeleton" />
        ))}
      </main>
    </div>
  );
}
