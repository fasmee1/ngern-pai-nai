import { IconBack } from "@/components/icons";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CompareClient } from "@/components/compare-client";
import { currentUser, loadCompareData } from "@/lib/load";
import { AiChat } from "@/components/ai-chat";

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="screen" aria-busy="true" />}>
      <CompareContent />
    </Suspense>
  );
}

async function CompareContent() {
  const user = await currentUser();
  if (!user) redirect("/");

  const data = await loadCompareData();

  return (
    <div className="screen">
      <div className="aurora" aria-hidden="true" />
      <header className="topbar">
        <Link href="/" className="icon-btn" aria-label="กลับ"><IconBack size={20} /></Link>
        <span className="brand">เปรียบเทียบรายจ่าย</span>
      </header>
      <main className="page">
        <CompareClient data={data} />
      </main>
      <AiChat />
    </div>
  );
}
