"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/components/auth/SessionProvider";
import { EXAM_GROUP_LABEL, examSchedule } from "@/content/exams";
import { listWatchedExamIds } from "@/lib/exams/watchlist";
import { daysUntil, nextDeadline } from "@/lib/exams/countdown";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * แสดงสองส่วนบน /today:
 * 1) ป้ายย่อ "เหตุการณ์ถัดไปที่ใกล้ที่สุด" (นับรวมทั้งวันสอบและวันปิดรับสมัครทุกแถว ผ่าน nextDeadline()
 *    เดียวกับป้ายใหญ่ใน /exams) — โชว์ให้ทุกคนเห็นแม้ไม่เคยกดติดตามอะไรเลย
 * 2) รายการสนามสอบที่ผู้ใช้กดติดตามไว้ซึ่งเหลือ <= 30 วัน (ของเดิม) — ถ้าอันที่ใกล้ที่สุดจากข้อ 1
 *    เป็นแถวเดียวกับที่ติดตามไว้อยู่แล้ว จะไม่แสดงซ้ำในรายการนี้
 *
 * ต้องมีสองส่วนนี้ครบ ไม่ใช่แค่ป้ายย่ออย่างเดียว เพราะกดปุ่ม "ติดตาม" ที่ /exams แล้วต้องเห็นผล
 * จริงที่นี่ด้วย ไม่งั้นปุ่มติดตามจะกลายเป็นปุ่มที่กดแล้วไม่มีผลอะไรเลย
 */
export function ExamReminders() {
  const { user } = useSession();
  const userId = user?.id ?? null;
  const [now, setNow] = useState(() => Date.now());
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // ป้ายนี้ไม่ต้องละเอียดถึงวินาทีเหมือนป้ายใหญ่ใน /exams — อัปเดตทุกนาทีพอ
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!userId) {
      setWatchedIds(new Set());
      return;
    }
    let cancelled = false;
    listWatchedExamIds(userId).then((ids) => {
      if (!cancelled) setWatchedIds(ids);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const deadline = nextDeadline(examSchedule, now);
  const deadlineDays = deadline ? Math.ceil((deadline.at - now) / DAY_MS) : null;

  const watchedReminders = examSchedule
    .filter((e) => watchedIds.has(e.id) && e.startsOn)
    .map((e) => ({ exam: e, days: daysUntil(e.startsOn!, now) }))
    .filter((r) => r.days >= 0 && r.days <= 30)
    // กันแสดงซ้ำกับป้ายย่อด้านบน ถ้าเป็นสนามสอบแถวเดียวกัน
    .filter((r) => !(deadline && deadline.exam.id === r.exam.id))
    .sort((a, b) => a.days - b.days);

  if (!deadline && watchedReminders.length === 0) return null;

  return (
    <div className="mb-8 flex flex-col gap-3">
      {deadline ? (
        <section className="rounded-lg border border-accent bg-accent-soft p-4">
          <p className="m-0 text-[14px] text-ink">
            {deadline.kind === "registration" ? "ปิดรับสมัคร " : "สอบ "}
            {EXAM_GROUP_LABEL[deadline.exam.examGroup]}
            {deadline.exam.subjectName ? ` — ${deadline.exam.subjectName}` : ""} ในอีก{" "}
            <strong className="font-semibold">{Math.max(0, deadlineDays!)} วัน</strong>
          </p>
          <Link
            href="/exams"
            className="mt-1 inline-block text-[13px] text-accent-ink no-underline hover:underline"
          >
            ดูตารางสอบทั้งหมด →
          </Link>
        </section>
      ) : null}

      {watchedReminders.length > 0 ? (
        <section className="rounded-lg border border-line bg-surface-2 p-4">
          <p className="m-0 mb-1.5 text-[13px] font-medium text-ink-2">สนามสอบที่ติดตามไว้ใกล้ถึงแล้ว</p>
          <div className="flex flex-col gap-1">
            {watchedReminders.map(({ exam, days }) => (
              <p key={exam.id} className="m-0 text-[13.5px] text-ink">
                {EXAM_GROUP_LABEL[exam.examGroup]}
                {exam.subjectName ? ` — ${exam.subjectName}` : ""} เหลืออีก {days} วัน
              </p>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
