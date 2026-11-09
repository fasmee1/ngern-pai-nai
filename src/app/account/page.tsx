import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";
import { DeleteAccount } from "@/components/delete-account";
import { ThemePicker } from "@/components/theme-picker";
import { ProfileCard } from "@/components/profile-card";
import { loadProfile, googleName, googlePhoto } from "@/lib/load";

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="screen" aria-busy="true" />}>
      <AccountContent />
    </Suspense>
  );
}

async function AccountContent() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/");

  const profile = await loadProfile(googleName(data.user), googlePhoto(data.user));

  return (
    <div className="screen">
      <div className="aurora" aria-hidden="true" />
      <header className="topbar">
        <Link href="/" className="link strong">กลับ</Link>
        <span className="brand">บัญชีของฉัน</span>
      </header>

      <main className="page">
        <section className="glass page-card">
          <h2>โปรไฟล์</h2>
          <ProfileCard initialName={profile.name} initialColor={profile.color} photo={profile.photo} email={data.user.email ?? ""} />
        </section>

        <section className="glass page-card">
          <h2>บัญชี</h2>
          <p className="page-text">เข้าระบบด้วยบัญชี Google</p>
          <SignOutButton />
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
    </div>
  );
}
