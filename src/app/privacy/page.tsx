import Link from "next/link";

export const metadata = {
  title: "นโยบายความเป็นส่วนตัว | เงินไปไหน",
};

export default function PrivacyPage() {
  return (
    <div className="screen">
      <div className="aurora" aria-hidden="true" />
      <header className="topbar">
        <Link href="/" className="link strong">กลับ</Link>
        <span className="brand">ความเป็นส่วนตัว</span>
      </header>

      <main className="page">
        <section className="glass page-card">
          <h2>เราเก็บอะไรบ้าง</h2>
          <ul className="page-list">
            <li>ชื่อและอีเมลจากบัญชี Google ที่คุณใช้เข้าระบบ</li>
            <li>รายการรับจ่าย ได้แก่ จำนวนเงิน วันที่ หมวด บัญชี และโน้ตที่คุณพิมพ์เอง</li>
            <li>งบที่คุณตั้งไว้ในแต่ละหมวด</li>
          </ul>
        </section>

        <section className="glass page-card">
          <h2>เราไม่เก็บอะไร</h2>
          <ul className="page-list">
            <li>รหัสผ่านของบัญชี Google</li>
            <li>เลขบัญชีธนาคารหรือเลขบัตรของคุณ</li>
          </ul>
        </section>

        <section className="glass page-card">
          <h2>ใครเห็นข้อมูลของคุณได้</h2>
          <p className="page-text">มีเพียงคุณคนเดียว ระบบล็อกข้อมูลให้แต่ละคนเห็นเฉพาะของตัวเอง ผู้ดูแลระบบไม่เปิดดูรายการของคุณ</p>
        </section>

        <section className="glass page-card">
          <h2>การลบข้อมูล</h2>
          <p className="page-text">กดลบบัญชีได้เองที่หน้าบัญชี ข้อมูลทั้งหมดจะถูกลบทันทีและกู้คืนไม่ได้</p>
        </section>

        <p className="page-text small">ฉบับร่างเริ่มต้น ปรับปรุงล่าสุดวันที่ 7 พฤศจิกายน 2569 ควรให้ผู้รู้ด้านกฎหมายตรวจก่อนเปิดให้คนทั่วไปใช้</p>
      </main>
    </div>
  );
}
