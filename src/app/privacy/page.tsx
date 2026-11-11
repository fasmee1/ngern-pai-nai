import { IconBack } from "@/components/icons";
import Link from "next/link";

export const metadata = {
  title: "นโยบายความเป็นส่วนตัว | เงินไปไหน",
};

export default function PrivacyPage() {
  return (
    <div className="screen">
      <div className="aurora" aria-hidden="true" />
      <header className="topbar">
        <Link href="/" className="icon-btn" aria-label="กลับ"><IconBack size={20} /></Link>
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
          <h2>ผู้ช่วย AI</h2>
          <p className="page-text">เมื่อคุณใช้ฟีเจอร์ AI ข้อมูลบางส่วนจะถูกส่งไปให้ Google Gemini ประมวลผลเพื่อตอบคุณเท่านั้น ได้แก่</p>
          <ul className="page-list">
            <li>แชตกับผู้ช่วย: ข้อความที่คุณพิมพ์ ยอดรวมรายรับรายจ่ายแยกหมวด ยอดเงินในบัญชี ชื่อเป้าหมายออมเงินและบิลประจำเดือน โดยไม่ส่งโน้ตของแต่ละรายการ</li>
            <li>พิมพ์สั้น ๆ ให้ AI กรอกให้: ประโยคที่คุณพิมพ์ และชื่อหมวด</li>
            <li>ถ่ายรูปสลิป: รูปที่คุณเลือก ส่งครั้งเดียวเพื่ออ่านยอดเงิน แอปไม่เก็บรูปไว้ ควรระวังไม่ถ่ายส่วนที่มีเลขบัญชีหรือข้อมูลอื่นที่ไม่ต้องการส่ง</li>
            <li>อ่านคำตอบออกเสียง: ข้อความคำตอบของผู้ช่วย</li>
          </ul>
          <p className="page-text">ผลของ AI เป็นเพียงคำแนะนำ ตรวจตัวเลขก่อนบันทึกทุกครั้ง และจำกัดการใช้ AI วันละ 60 ครั้งต่อคน</p>
        </section>

        <section className="glass page-card">
          <h2>การส่งออกและลบข้อมูล</h2>
          <p className="page-text">ดาวน์โหลดรายการทั้งหมดเป็นไฟล์ตารางได้เองที่หน้าบัญชี</p>
        </section>

        <section className="glass page-card">
          <h2>การลบข้อมูล</h2>
          <p className="page-text">กดลบบัญชีได้เองที่หน้าบัญชี ข้อมูลทั้งหมดจะถูกลบทันทีและกู้คืนไม่ได้</p>
        </section>

        <p className="page-text small">ฉบับร่างเริ่มต้น ปรับปรุงล่าสุดวันที่ 11 พฤศจิกายน 2569 ควรให้ผู้รู้ด้านกฎหมายตรวจก่อนเปิดให้คนทั่วไปใช้</p>
      </main>
    </div>
  );
}
