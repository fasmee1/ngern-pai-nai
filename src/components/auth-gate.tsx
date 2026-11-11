import { SignInScreen } from "./sign-in-screen";
import { HomeClient } from "./home-client";
import { BankSetup } from "./bank-setup";
import { currentUser, googleName, googlePhoto, loadBillAlerts, loadMonth, loadProfile } from "@/lib/load";
import { ensureSetup } from "@/app/actions";
import { monthStart, nextMonthStart, previousMonthStart, thaiMonthLabel, todayInBangkok } from "@/lib/dates";

// Reads the session cookie, so it must run inside Suspense.
export async function AuthGate({ failed, month: monthParam }: { failed: boolean; month?: string }) {
  const user = await currentUser();

  if (!user) {
    return <SignInScreen failed={failed} />;
  }

  await ensureSetup();
  const [month, profile, billAlerts] = await Promise.all([
    loadMonth(monthParam),
    loadProfile(googleName(user), googlePhoto(user)),
    loadBillAlerts(),
  ]);

  if (!profile.accountsSetup) {
    return <BankSetup name={profile.name} />;
  }

  // Arrows for the month being shown. There is no way forward from the current month.
  const current = monthStart(todayInBangkok());
  const hrefFor = (m: string) => (m === current ? "/" : `/?m=${m.slice(0, 7)}`);
  const monthNav = {
    prevHref: hrefFor(previousMonthStart(month.month)),
    nextHref: month.month < current ? hrefFor(nextMonthStart(month.month)) : null,
    isCurrent: month.month === current,
  };

  return (
    <HomeClient
      data={month}
      profile={profile}
      email={user.email ?? ""}
      monthLabel={thaiMonthLabel(month.month)}
      monthNav={monthNav}
      billAlerts={monthNav.isCurrent ? billAlerts : []}
    />
  );
}
