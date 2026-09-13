import type { Metadata } from "next";
import { ProgressBoard } from "@/components/progress/ProgressBoard";
import { ProgressCharts } from "@/components/analytics/ProgressCharts";
import { buildProgressIndex } from "@/lib/repo/progress-index";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "ความก้าวหน้า",
  description: "ดูว่าเรียนไปถึงไหน บทไหนยังไม่แน่น และควรทำอะไรต่อ",
};

export default function ProgressPage() {
  const lessons = buildProgressIndex();

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <header className="mb-9 border-b border-line pb-6">
        <Eyebrow>เส้นทางของคุณ</Eyebrow>
        <h1 className="m-0 mb-3 font-display text-[clamp(26px,4vw,38px)] font-bold tracking-tight text-ink">
          ความก้าวหน้า
        </h1>
        <p className="m-0 max-w-[62ch] text-[16px] leading-relaxed text-ink-2">
          รวมสิ่งที่บันทึกไว้ทั้งหมด — บทที่อ่านจบ ผลแบบฝึก และผลข้อสอบจำลอง —
          แล้วตอบคำถามเดียวว่า <strong className="font-semibold text-ink">ตอนนี้ควรทำอะไรต่อ</strong>{" "}
          โดยเรียงตามลำดับพื้นฐานที่วางไว้ ไม่ใช่เรียงตามหน้าหนังสือ
        </p>
        <p className="m-0 mt-3 text-[14.5px] leading-relaxed text-ink-3">
          ความก้าวหน้าเก็บไว้ในเบราว์เซอร์เครื่องนี้เสมอ ไม่ต้องสมัครสมาชิกก็ใช้งานได้ —
          ถ้าล็อกอินด้วย Google ข้อมูลจะถูกซิงก์ขึ้นบัญชีของคุณด้วย ไม่หายแม้เปลี่ยนเครื่องหรือล้างข้อมูลเบราว์เซอร์
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <LinkButton href="/today" variant="ghost">
            ไปหน้าวันนี้ →
          </LinkButton>
          <LinkButton href="/plan" variant="ghost">
            วางแผนอ่านหนังสือ →
          </LinkButton>
          <LinkButton href="/exams" variant="ghost">
            ตารางสอบ TGAT/TPAT/A-Level →
          </LinkButton>
        </div>
      </header>

      <ProgressBoard lessons={lessons} />

      <section className="mt-10">
        <h2 className="m-0 mb-1 font-display text-[20px] font-semibold text-ink">กราฟพัฒนาการ</h2>
        <p className="m-0 mb-4 max-w-[62ch] text-[14.5px] leading-relaxed text-ink-3">
          คำนวณสดจากเหตุการณ์ดิบทุกครั้งที่เปิดหน้านี้ ไม่มีค่าสรุปเก็บไว้ล่วงหน้า
        </p>
        <ProgressCharts
          topicIndex={lessons.map((l) => ({
            slug: l.slug,
            topicId: l.topicId,
            topicTitle: l.topicTitle,
          }))}
        />
      </section>
    </div>
  );
}
