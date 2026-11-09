import { SignInScreen } from "./sign-in-screen";
import { HomeClient } from "./home-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { googleName, googlePhoto, loadMonth, loadProfile } from "@/lib/load";
import { ensureSetup } from "@/app/actions";
import { thaiMonthLabel } from "@/lib/dates";

// Reads the session cookie, so it must run inside Suspense.
export async function AuthGate({ failed }: { failed: boolean }) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return <SignInScreen failed={failed} />;
  }

  await ensureSetup();
  const [month, profile] = await Promise.all([loadMonth(), loadProfile(googleName(data.user), googlePhoto(data.user))]);

  return (
    <HomeClient
      data={month}
      profile={profile}
      email={data.user.email ?? ""}
      monthLabel={thaiMonthLabel(month.month)}
    />
  );
}
