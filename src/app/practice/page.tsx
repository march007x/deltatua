import type { Metadata } from "next";
import { PracticeIndex } from "@/components/practice/PracticeIndex";
import { getPracticeIndex } from "@/lib/repo/practice";
import { Eyebrow } from "@/components/ui/Eyebrow";

export const metadata: Metadata = {
  title: "ฝึกโจทย์",
  description:
    "ชุดโจทย์ฝึกแยกตามบท พร้อมเฉลยทีละข้อ และสรุปว่าบทไหนที่ควรกลับไปทบทวนก่อน",
};

export default function PracticeHubPage() {
  const sets = getPracticeIndex();
  const total = sets.reduce((n, s) => n + s.count, 0);

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <header className="mb-9 border-b border-line pb-6">
        <Eyebrow>ฝึกและทบทวน</Eyebrow>
        <h1 className="m-0 mb-3 font-display text-[clamp(26px,4vw,38px)] font-bold tracking-tight text-ink">
          ฝึกโจทย์
        </h1>
        <p className="m-0 max-w-[62ch] text-[16px] leading-relaxed text-ink-2">
          โจทย์ {total} ข้อจาก {sets.length} บท แยกเป็นชุดตามบทเรียน · สับลำดับใหม่ทุกครั้ง ·
          <strong className="font-semibold text-ink">ไม่เฉลยระหว่างทำ</strong>{" "}
          เฉลยทุกข้อขึ้นพร้อมกันเมื่อทำจบชุด ระหว่างทางกดขอแนวทางแบบไล่ระดับได้
        </p>
        <p className="m-0 mt-3 text-[14.5px] leading-relaxed text-ink-3">
          สรุปผลรอบล่าสุดที่เห็นตรงนี้คำนวณสดจากคำตอบแต่ละข้อที่บันทึกไว้ — โหมดแขก (ไม่ล็อกอิน):
          อยู่ในเบราว์เซอร์เครื่องนี้เท่านั้น เปลี่ยนเครื่องหรือล้างข้อมูลเบราว์เซอร์แล้วจะหาย
          ถ้าล็อกอินด้วย Google คำตอบแต่ละข้อจะถูกบันทึกขึ้นบัญชีด้วย ทำให้สรุปนี้เห็นเหมือนกันทุกเครื่องที่ล็อกอิน
          และใช้คำนวณกราฟความแม่นยำที่หน้าความก้าวหน้าได้
        </p>
      </header>

      <PracticeIndex sets={sets} />
    </div>
  );
}
