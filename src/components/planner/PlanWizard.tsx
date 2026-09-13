"use client";

import { useState } from "react";
import type { Course } from "@/content/schema";
import type { ProgressLesson } from "@/lib/repo/progress-index";
import type { MinutesPerDay } from "@/lib/planner/generate";
import { WEEKDAY_KEYS } from "@/lib/planner/generate";
import { Button } from "@/components/ui/Button";

const todayIso = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());

function uniformMinutesPerDay(minutes: number): MinutesPerDay {
  return Object.fromEntries(WEEKDAY_KEYS.map((k) => [k, minutes])) as MinutesPerDay;
}

/** ตัวช่วยสร้างแผน 3 คำถาม — ที่เหลือระบบคิดให้ทั้งหมดจากบทที่ยังไม่ผ่านจริงของสนามสอบที่เลือก */
export function PlanWizard({
  courses,
  lessons,
  onCreate,
}: {
  courses: Course[];
  lessons: ProgressLesson[];
  onCreate: (
    input: { targetExam: string; examDate: string; startDate: string; minutesPerDay: MinutesPerDay },
    lessons: ProgressLesson[],
  ) => Promise<{ ok: boolean; shortfallMinutes: number }>;
}) {
  const [targetExam, setTargetExam] = useState(courses[0]?.slug ?? "");
  const [examDate, setExamDate] = useState("");
  const [minutesPerDay, setMinutesPerDay] = useState(45);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shortfall, setShortfall] = useState<number | null>(null);

  const pendingCount = lessons.filter((l) => l.courseSlug === targetExam).length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!targetExam || !examDate) {
      setError("กรอกให้ครบทั้งสนามสอบและวันสอบ");
      return;
    }
    if (examDate <= todayIso) {
      setError("วันสอบต้องเป็นวันในอนาคต");
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await onCreate(
      {
        targetExam,
        examDate,
        startDate: todayIso,
        minutesPerDay: uniformMinutesPerDay(minutesPerDay),
      },
      lessons,
    );
    setSubmitting(false);
    if (!result.ok) {
      setError("สร้างแผนไม่สำเร็จ ลองใหม่อีกครั้ง");
      return;
    }
    setShortfall(result.shortfallMinutes);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-card border border-line bg-surface p-5 sm:p-6"
    >
      <div>
        <label className="mb-1.5 block text-[12.5px] font-medium text-ink-3">1. สอบสนามไหน</label>
        <select
          value={targetExam}
          onChange={(e) => setTargetExam(e.target.value)}
          className="w-full rounded-field border border-line-strong bg-surface-2 px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-accent"
        >
          {courses.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.title}
            </option>
          ))}
        </select>
        <p className="m-0 mt-1.5 text-[12.5px] text-ink-3">
          บทที่ยังไม่ผ่านในสนามนี้ตอนนี้มี {pendingCount} บท
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-[12.5px] font-medium text-ink-3">2. สอบวันไหน</label>
        <input
          type="date"
          value={examDate}
          onChange={(e) => setExamDate(e.target.value)}
          min={todayIso}
          className="w-full max-w-[220px] rounded-field border border-line-strong bg-surface-2 px-3.5 py-2.5 text-[15px] tabular-nums text-ink outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[12.5px] font-medium text-ink-3">3. ว่างวันละกี่นาที</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={5}
            max={480}
            step={5}
            value={minutesPerDay}
            onChange={(e) => setMinutesPerDay(Number(e.target.value))}
            className="w-28 rounded-field border border-line-strong bg-surface-2 px-3.5 py-2.5 text-[15px] tabular-nums text-ink outline-none focus:border-accent"
          />
          <span className="text-[14px] text-ink-2">นาที/วัน (ปิดบางวันในสัปดาห์ได้ทีหลัง)</span>
        </div>
      </div>

      {error ? <p className="m-0 text-[13.5px] text-danger">{error}</p> : null}

      {shortfall !== null ? (
        shortfall > 0 ? (
          <p className="m-0 rounded-card border border-warn bg-warn-soft px-4 py-2.5 text-[13.5px] text-ink">
            สร้างแผนแล้ว แต่เวลาว่างที่มีไม่พอ ขาดอีกประมาณ {shortfall} นาทีกว่าจะครบก่อนวันสอบ —
            เพิ่มเวลาต่อวันหรือตัดบทบางบทได้ในหน้าแผน
          </p>
        ) : (
          <p className="m-0 rounded-card border border-ok bg-ok-soft px-4 py-2.5 text-[13.5px] text-ink">
            สร้างแผนสำเร็จ เวลาว่างพอสำหรับบททั้งหมดก่อนวันสอบ
          </p>
        )
      ) : null}

      <Button type="submit" variant="primary" loading={submitting} disabled={pendingCount === 0} className="self-start">
        สร้างแผน
      </Button>
      {pendingCount === 0 ? (
        <p className="m-0 text-[12.5px] text-ink-3">เรียนจบทุกบทในสนามนี้แล้ว ไม่ต้องสร้างแผนเพิ่ม</p>
      ) : null}
    </form>
  );
}
