import { Suspense } from "react";
import { AppSkeleton } from "@/components/app-skeleton";
import { AuthGate } from "@/components/auth-gate";

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
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
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return <AuthGate failed={error === "login"} />;
}
