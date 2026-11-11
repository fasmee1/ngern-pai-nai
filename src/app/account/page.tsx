import { IconBack } from "@/components/icons";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/page-skeleton";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { DeleteAccount } from "@/components/delete-account";
import { ThemePicker } from "@/components/theme-picker";
import { ProfileCard } from "@/components/profile-card";
import { currentUser, loadProfile, googleName, googlePhoto } from "@/lib/load";
import { AiChat } from "@/components/ai-chat";

export default function AccountPage() {
  return (
    <Suspense fallback={<PageSkeleton title="บัญชีของฉัน" />}>
      <AccountContent />
    </Suspense>
  );
}

async function AccountContent() {
  const user = await currentUser();
  if (!user) redirect("/");

  const profile = await loadProfile(googleName(user), googlePhoto(user));

  return (
    <div className="screen">
      <div className="aurora" aria-hidden="true" />
      <header className="topbar">
        <Link href="/" className="icon-btn" aria-label="กลับ"><IconBack size={20} /></Link>
        <span className="brand">บัญชีของฉัน</span>
      </header>

      <main className="page">
        <section className="glass page-card">
          <h2>โปรไฟล์</h2>
          <ProfileCard initialName={profile.name} initialColor={profile.color} photo={profile.photo} email={user.email ?? ""} />
        </section>

        <section className="glass page-card">
          <h2>บัญชีธนาคาร</h2>
          <p className="page-text">เลือกธนาคารที่ใช้ เพิ่มภายหลัง และย้ายเงินระหว่างบัญชี</p>
          <Link href="/wallets" className="ghost wide icon-button">จัดการบัญชีธนาคาร</Link>
        </section>

        <section className="glass page-card">
          <h2>บัญชี</h2>
          <p className="page-text">เข้าระบบด้วยบัญชี Google</p>
          <SignOutButton />
        </section>

        <section className="glass page-card">
          <h2>ส่งออกข้อมูล</h2>
          <p className="page-text">ดาวน์โหลดรายการทั้งหมดเป็นไฟล์ตาราง เปิดใน Excel หรือ Google Sheets ได้ เก็บไว้สำรองหรือใช้ทำภาษี</p>
          <a href="/api/export" download className="ghost wide icon-button">ดาวน์โหลดรายการทั้งหมด</a>
        </section>

        <section className="glass page-card">
          <h2>หน้าตา</h2>
          <p className="page-text">เลือกโหมดสว่างหรือมืด หรือให้ตามการตั้งค่าของเครื่อง</p>
          <ThemePicker />
        </section>

        <section className="glass page-card">
          <h2>ข้อมูลส่วนตัว</h2>
          <p className="page-text">
            เราเก็บเฉพาะที่จำเป็น คือชื่อบัญชี Google อีเมล และรายการที่คุณจด ไม่เก็บรหัสผ่าน
            อ่านรายละเอียดได้ที่ <Link href="/privacy" className="link strong">นโยบายความเป็นส่วนตัว</Link>
          </p>
        </section>

        <section className="glass page-card">
          <h2>ลบบัญชีและข้อมูลทั้งหมด</h2>
          <p className="page-text">เมื่อลบแล้วรายการทั้งหมดจะหายไปและกู้คืนไม่ได้</p>
          <DeleteAccount />
        </section>
      </main>
      <AiChat />
    </div>
  );
}
