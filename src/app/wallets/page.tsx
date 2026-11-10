import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { IconBack } from "@/components/icons";
import { WalletsClient } from "@/components/wallets-client";
import { currentUser, loadWallets } from "@/lib/load";
import { AiChat } from "@/components/ai-chat";

export default function WalletsPage() {
  return (
    <Suspense fallback={<div className="screen" aria-busy="true" />}>
      <WalletsContent />
    </Suspense>
  );
}

async function WalletsContent() {
  const user = await currentUser();
  if (!user) redirect("/");

  const data = await loadWallets();

  return (
    <div className="screen">
      <div className="aurora" aria-hidden="true" />
      <header className="topbar">
        <Link href="/" className="icon-btn" aria-label="กลับ"><IconBack size={20} /></Link>
        <span className="brand">บัญชีเงิน</span>
      </header>
      <main className="page">
        <WalletsClient data={data} />
      </main>
      <AiChat />
    </div>
  );
}
