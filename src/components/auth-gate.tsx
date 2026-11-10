import { SignInScreen } from "./sign-in-screen";
import { HomeClient } from "./home-client";
import { currentUser, googleName, googlePhoto, loadMonth, loadProfile } from "@/lib/load";
import { ensureSetup } from "@/app/actions";
import { thaiMonthLabel } from "@/lib/dates";

// Reads the session cookie, so it must run inside Suspense.
export async function AuthGate({ failed }: { failed: boolean }) {
  const user = await currentUser();

  if (!user) {
    return <SignInScreen failed={failed} />;
  }

  await ensureSetup();
  const [month, profile] = await Promise.all([loadMonth(), loadProfile(googleName(user), googlePhoto(user))]);

  return (
    <HomeClient
      data={month}
      profile={profile}
      email={user.email ?? ""}
      monthLabel={thaiMonthLabel(month.month)}
    />
  );
}
