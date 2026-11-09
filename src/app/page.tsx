import { Suspense } from "react";
import { AuthGate } from "@/components/auth-gate";

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <Suspense fallback={<div className="screen" aria-busy="true" />}>
      <HomeGate searchParams={searchParams} />
    </Suspense>
  );
}

async function HomeGate({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return <AuthGate failed={error === "login"} />;
}
