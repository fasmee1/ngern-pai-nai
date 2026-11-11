import { Suspense } from "react";
import { AppSkeleton } from "@/components/app-skeleton";
import { AuthGate } from "@/components/auth-gate";

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; m?: string }>;
}) {
  return (
    <Suspense fallback={<AppSkeleton />}>
      <HomeGate searchParams={searchParams} />
    </Suspense>
  );
}

async function HomeGate({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; m?: string }>;
}) {
  const { error, m } = await searchParams;
  return <AuthGate failed={error === "login"} month={m} />;
}
