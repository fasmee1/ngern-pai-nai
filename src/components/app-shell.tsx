"use client";

// App frame for signed-in screens: header, scrolling content, and a floating bottom tab bar.
// Mobile-first, like a native app. The center button adds a transaction.

import type { ReactNode } from "react";
import Link from "next/link";
import { IconAccount, IconAdd, IconBack, IconBudget, IconChevron, IconList, IconSummary } from "./icons";
import { Avatar } from "./avatar";
import { LogoLockup } from "./logo";
import { AiChat } from "./ai-chat";

export type Tab = "summary" | "list" | "budget";

// Arrows next to the month name. nextHref is null on the current month.
export type MonthNav = { prevHref: string; nextHref: string | null; isCurrent: boolean };

const LEFT_TABS: { id: Tab; label: string; Icon: typeof IconSummary }[] = [
  { id: "summary", label: "สรุป", Icon: IconSummary },
  { id: "list", label: "รายการ", Icon: IconList },
];
const RIGHT_TABS: { id: Tab; label: string; Icon: typeof IconSummary }[] = [
  { id: "budget", label: "งบ", Icon: IconBudget },
];

export function AppShell({
  title,
  subtitle,
  profile,
  tab,
  onTab,
  onAdd,
  accountHref = "/account",
  monthNav,
  children,
}: {
  title: string;
  subtitle: string;
  profile?: { name: string; color: string; photo?: string | null };
  tab: Tab;
  onTab: (tab: Tab) => void;
  onAdd: () => void;
  accountHref?: string;
  monthNav?: MonthNav;
  children: ReactNode;
}) {
  return (
    <div className="app">
      <div className="aurora" aria-hidden="true" />

      <header className="appbar">
        <div className="appbar-brand">
          <LogoLockup size={34} id="logo-app" />
          <div className="appbar-actions">
            <Link href={accountHref} className="avatar" aria-label="โปรไฟล์และบัญชีของฉัน">
              {profile ? <Avatar name={profile.name} color={profile.color} size={44} photo={profile.photo ?? null} /> : <IconAccount size={20} />}
            </Link>
          </div>
        </div>
        <div className="appbar-text">
          {monthNav ? (
            <div className="month-nav">
              <Link href={monthNav.prevHref} scroll={false} className="month-arrow" aria-label="เดือนก่อนหน้า"><IconBack size={16} /></Link>
              <p className="appbar-sub">{subtitle}</p>
              {monthNav.nextHref ? (
                <Link href={monthNav.nextHref} scroll={false} className="month-arrow" aria-label="เดือนถัดไป"><IconChevron size={16} /></Link>
              ) : (
                <span className="month-arrow off" aria-hidden="true"><IconChevron size={16} /></span>
              )}
            </div>
          ) : (
            <p className="appbar-sub">{subtitle}</p>
          )}
          <h1 className="appbar-title">{title}</h1>
        </div>
      </header>

      <main className="app-main">{children}</main>

      <AiChat />

      <nav className="tabbar" aria-label="เมนูหลัก">
        {LEFT_TABS.map(({ id, label, Icon }) => (
          <TabButton key={id} id={id} label={label} Icon={Icon} active={tab === id} onTab={onTab} />
        ))}
        <button type="button" className="fab" onClick={onAdd} aria-label="จดรายการ">
          <IconAdd size={26} strokeWidth={2.2} />
        </button>
        {RIGHT_TABS.map(({ id, label, Icon }) => (
          <TabButton key={id} id={id} label={label} Icon={Icon} active={tab === id} onTab={onTab} />
        ))}
        <Link href={accountHref} className="tab">
          <IconAccount size={22} />
          <span>บัญชี</span>
        </Link>
      </nav>
    </div>
  );
}

function TabButton({
  id,
  label,
  Icon,
  active,
  onTab,
}: {
  id: Tab;
  label: string;
  Icon: typeof IconSummary;
  active: boolean;
  onTab: (tab: Tab) => void;
}) {
  return (
    <button type="button" className="tab" aria-current={active ? "page" : undefined} onClick={() => onTab(id)}>
      <Icon size={22} />
      <span>{label}</span>
    </button>
  );
}
