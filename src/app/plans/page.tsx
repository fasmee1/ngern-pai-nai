import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { IconBack } from "@/components/icons";
import { PlansClient } from "@/components/plans-client";
import { currentUser, loadPlans } from "@/lib/load";
import { AiChat } from "@/components/ai-chat";

export default function PlansPage() {
  return (
    <Suspense fallback={<div className="screen" aria-busy="true" />}>
      <PlansContent />
    </Suspense>
  );
}

async function PlansContent() {
  const user = await currentUser();
  if (!user) redirect("/");

  const data = await loadPlans();

  return (
    <div className="screen">
      <div className="aurora" aria-hidden="true" />
      <header className="topbar">
        <Link href="/" className="icon-btn" aria-label="กลับ"><IconBack size={20} /></Link>
        <span className="brand">เป้าหมายและบิล</span>
      </header>
      <main className="page">
        <PlansClient data={data} />
      </main>
      <AiChat />
    </div>
  );
}
