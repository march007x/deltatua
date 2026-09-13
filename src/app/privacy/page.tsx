import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "ความเป็นส่วนตัว",
  description: "ข้อมูลอะไรบ้างที่เว็บนี้เก็บและไม่เก็บ",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <header className="mb-8 border-b border-line pb-6">
        <h1 className="m-0 mb-3 font-display text-[clamp(26px,4vw,36px)] font-bold tracking-tight text-ink">
          ความเป็นส่วนตัว
        </h1>
        <p className="m-0 text-[16px] text-ink-2">
          หน้านี้บอกตรง ๆ ว่า {SITE.name} เก็บอะไรและไม่เก็บอะไร — อ่านจบได้ในสองนาที
        </p>
      </header>

      <div className="rounded-lg border-l-[3px] border-l-ok bg-ok-soft px-5 py-4">
        <p className="m-0 font-display text-[16px] font-semibold text-ink">
          สรุปสั้นที่สุด: เรียนแบบไม่ผูกบัญชีได้เสมอ — การล็อกอินเป็นทางเลือก ไม่ใช่ข้อบังคับ
        </p>
        <p className="m-0 mt-1 text-[14.5px] leading-relaxed text-ink-2">
          ไม่ล็อกอิน: ไม่มีข้อมูลใดออกจากเบราว์เซอร์ของคุณเลย · ล็อกอิน: เก็บเท่าที่จำเป็นต่อการซิงก์ความก้าวหน้าข้ามเครื่องเท่านั้น
        </p>
      </div>

      <h2 className="mt-9 mb-2 font-display text-[19px] font-semibold text-ink">
        โหมดแขก (ไม่ล็อกอิน)
      </h2>
      <p className="text-[16px] leading-[1.8] text-ink-2">
        ความก้าวหน้าการเรียน ผลแบบฝึกหัด และผลข้อสอบจำลอง ถูกเก็บไว้ใน{" "}
        <b className="text-ink">เบราว์เซอร์ของคุณเอง</b> ผ่าน localStorage เท่านั้น
        ไม่เคยถูกส่งออกไปที่เซิร์ฟเวอร์ใด ๆ ถ้าล้างข้อมูลเบราว์เซอร์ เปลี่ยนเครื่อง หรือเปิดโหมดไม่ระบุตัวตน
        ความก้าวหน้าจะไม่ตามไปด้วย
      </p>

      <h2 className="mt-8 mb-2 font-display text-[19px] font-semibold text-ink">
        โหมดสมาชิก (ล็อกอินด้วย Google)
      </h2>
      <p className="text-[16px] leading-[1.8] text-ink-2">
        ถ้าคุณเลือกล็อกอินที่หน้า <b className="text-ink">เข้าสู่ระบบ</b> เราเก็บข้อมูลเท่าที่จำเป็นต่อการซิงก์
        ความก้าวหน้าข้ามเครื่อง โดยต้องติ๊กยินยอมก่อนกดเข้าสู่ระบบทุกครั้ง:
      </p>
      <ul className="pl-5 text-[16px] leading-[1.8] text-ink-2">
        <li>
          <b className="text-ink">อีเมล</b> จากบัญชี Google — ใช้ระบุตัวตนอย่างเดียว ไม่แสดงต่อผู้ใช้คนอื่น
        </li>
        <li>
          <b className="text-ink">ความก้าวหน้ารายบท</b> — สถานะ (ยังไม่เริ่ม / กำลังเรียน / เรียนจบ)
          และเวลาที่เปิด/จบบทนั้น
        </li>
        <li>
          <b className="text-ink">ครั้งที่ตอบโจทย์แต่ละข้อ</b> — โจทย์ข้อไหน ตอบถูกหรือผิด
          ใช้เวลากี่วินาที และมาจากแบบฝึกหัดหรือข้อสอบชุดไหน (ไม่เก็บว่าคุณเลือกตัวเลือกไหนหรือพิมพ์คำตอบอะไรลงไป)
        </li>
        <li>
          <b className="text-ink">ช่วงเวลาที่เรียน/ฝึก/ทำข้อสอบ</b> — วันเวลาเริ่มและจบ
          กับจำนวนนาทีที่มีการใช้งานจริง (ไม่นับเวลาที่เปิดหน้าจอทิ้งไว้เฉย ๆ)
        </li>
        <li>
          <b className="text-ink">ผลข้อสอบจำลองแต่ละครั้ง</b> — คะแนน บทที่อ่อน และเวลาที่ใช้ทำ
        </li>
        <li>
          <b className="text-ink">แผนอ่านหนังสือ</b> — วันสอบเป้าหมาย เวลาว่างที่คุณตั้งไว้ต่อวัน
          และรายการที่ระบบจัดลงปฏิทินให้
        </li>
        <li>
          <b className="text-ink">งานที่คุณพิมพ์เองในหน้างานที่ต้องทำ</b> — ชื่องาน วันที่ เวลา
          ระดับความสำคัญ ชนิดงาน (งานทั่วไป/การบ้าน/สอบ) วิชา และบันทึกเพิ่มเติมที่คุณพิมพ์ไว้
          (เฉพาะช่องที่คุณกรอกจริง)
        </li>
        <li>
          <b className="text-ink">สนามสอบที่กดติดตาม</b> — ใช้แจ้งเตือนเมื่อใกล้ถึงวันสอบ
        </li>
        <li>
          <b className="text-ink">วันที่ยินยอม</b> — เวลาที่คุณกดยินยอมเก็บข้อมูลครั้งแรก
        </li>
      </ul>
      <p className="text-[16px] leading-[1.8] text-ink-2">
        ข้อมูลเก็บอยู่บน Supabase (ผู้ให้บริการฐานข้อมูล) และตั้งค่าไว้ให้{" "}
        <b className="text-ink">เฉพาะเจ้าของบัญชีเท่านั้นที่อ่านข้อมูลของตัวเองได้</b> (Row Level Security)
        ทีมพัฒนาไม่เข้าถึงข้อมูลรายบุคคลผ่านหน้าเว็บปกติ
      </p>

      <h2 className="mt-8 mb-2 font-display text-[19px] font-semibold text-ink">ข้อมูลที่ไม่เก็บเลย</h2>
      <ul className="pl-5 text-[16px] leading-[1.8] text-ink-2">
        <li>รหัสผ่านของคุณ — ยืนยันตัวตนผ่าน Google โดยตรง เราไม่เห็นและไม่เก็บรหัสผ่าน</li>
        <li>ชื่อ เบอร์โทร โรงเรียน หรือข้อมูลระบุตัวตนอื่นนอกจากอีเมล</li>
        <li>
          ตัวเลือกที่คุณเลือกหรือคำตอบที่คุณพิมพ์ในควิซแต่ละข้อ — เก็บแค่ว่าถูกหรือผิด
          ไม่เก็บว่าเลือกอะไรหรือพิมพ์อะไรลงไป
        </li>
        <li>ไม่มีระบบติดตามพฤติกรรม ไม่มีโฆษณา ไม่มีการขายข้อมูลให้ใคร</li>
      </ul>

      <h2 className="mt-8 mb-2 font-display text-[19px] font-semibold text-ink">
        บริการภายนอกที่เว็บนี้เรียกใช้
      </h2>
      <ul className="pl-5 text-[16px] leading-[1.8] text-ink-2">
        <li>
          <b className="text-ink">Google</b> — ใช้ยืนยันตัวตนเวลาล็อกอิน (OAuth) เบราว์เซอร์ของคุณติดต่อ Google โดยตรง
        </li>
        <li>
          <b className="text-ink">Supabase</b> — ผู้ให้บริการฐานข้อมูลที่เก็บบัญชีและความก้าวหน้าของสมาชิก
        </li>
        <li>
          <b className="text-ink">Google Fonts</b> — ใช้โหลดฟอนต์ที่ใช้แสดงผล
        </li>
        <li>
          <b className="text-ink">ผู้ให้บริการโฮสต์</b> — เก็บบันทึกการเข้าถึงตามปกติของเซิร์ฟเวอร์เว็บ
          เช่นหมายเลขไอพีและหน้าที่เปิด ซึ่งเป็นสิ่งที่เว็บทุกเว็บมี
        </li>
      </ul>

      <h2 className="mt-8 mb-2 font-display text-[19px] font-semibold text-ink">ลบข้อมูลของคุณ</h2>
      <p className="text-[16px] leading-[1.8] text-ink-2">
        <b className="text-ink">โหมดแขก</b> — ล้างข้อมูลเว็บไซต์นี้ในตั้งค่าเบราว์เซอร์ คือการลบทุกอย่างที่เว็บนี้เก็บไว้เกี่ยวกับคุณ
        ไม่ต้องติดต่อใครและไม่ต้องรออนุมัติ
      </p>
      <p className="text-[16px] leading-[1.8] text-ink-2">
        <b className="text-ink">โหมดสมาชิก</b> — ไปที่หน้าบัญชีของฉัน แล้วกดลบบัญชี (ต้องยืนยันสองครั้ง)
        ระบบจะลบบัญชีและข้อมูลทั้งหมดที่ผูกกับบัญชีนั้นทันทีและถาวร กู้คืนไม่ได้
      </p>

      <p className="mt-10 font-mono text-[12.5px] text-ink-3">
        ปรับปรุงล่าสุด: กันยายน 2569 · {SITE.name} เป็นโครงการเพื่อการศึกษา
      </p>
    </div>
  );
}
