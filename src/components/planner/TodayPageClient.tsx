"use client";

import { useMemo } from "react";
import Link from "next/link";
import { cx } from "@/lib/utils";
import type { ProgressLesson } from "@/lib/repo/progress-index";
import { usePlanner } from "@/lib/planner/useActivePlan";
import { computePlanStatus, isItemDone } from "@/lib/planner/status";
import { DAY_MS, parseIsoDate } from "@/lib/planner/generate";
import { ExamReminders } from "@/components/exams/ExamReminders";
import { useTasks } from "@/lib/tasks/useTasks";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LinkButton } from "@/components/ui/Button";

const todayIso = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());

/** สอบที่ผู้ใช้พิมพ์เอง (kind='exam') ที่ยังไม่ถึงหรือถึงวันนี้พอดี และยังไม่เสร็จ — เรียงใกล้สุดก่อน
 * ต้องแยกกล่องจาก ExamReminders (ข้อมูลสนามสอบระดับชาติ) เสมอ ไม่งั้นผู้ใช้แยกไม่ออกว่าอันไหนมาจากไหน */
function UserExamReminders({ lessons }: { lessons: ProgressLesson[] }) {
  const tasks = useTasks(lessons);
  const upcomingExams = useMemo(
    () =>
      tasks.all
        .filter((t) => t.source === "user" && t.taskKind === "exam" && t.dueDate && t.dueDate >= todayIso)
        .map((t) => ({
          task: t,
          days: Math.round((parseIsoDate(t.dueDate!) - parseIsoDate(todayIso)) / DAY_MS),
        }))
        .sort((a, b) => a.days - b.days),
    [tasks.all],
  );

  if (!tasks.ready || upcomingExams.length === 0) return null;

  return (
    <section className="mb-8 rounded-card border border-line-strong bg-surface-2 p-4">
      <p className="m-0 mb-1.5 text-[13px] font-medium text-ink-2">สอบที่คุณบันทึกไว้เอง</p>
      <p className="m-0 mb-2 text-[12px] text-ink-3">
        รายการนี้มาจากที่คุณพิมพ์ไว้ใน &ldquo;งานที่ต้องทำ&rdquo; ไม่ใช่ประกาศจากหน่วยงานทางการ
      </p>
      <div className="flex flex-col gap-1">
        {upcomingExams.map(({ task, days }) => (
          <p key={task.id} className="m-0 text-[13.5px] text-ink">
            {task.title}
            {task.subject ? ` — ${task.subject}` : ""}{" "}
            {days === 0 ? "สอบวันนี้" : `เหลืออีก ${days} วัน`}
          </p>
        ))}
      </div>
    </section>
  );
}

export function TodayPageClient({ lessons }: { lessons: ProgressLesson[] }) {
  const { ready, plan, items, lessonProgress } = usePlanner();

  const status = useMemo(
    () => (plan ? computePlanStatus(items, lessons, lessonProgress, plan.examDate, todayIso) : null),
    [plan, items, lessons, lessonProgress],
  );

  const todayItems = useMemo(() => items.filter((it) => it.date === todayIso), [items]);

  if (!ready) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-12">
        <p className="m-0 rounded-card border border-dashed border-line-strong bg-surface-2 px-4 py-8 text-center text-[14px] text-ink-3">
          กำลังโหลด…
        </p>
      </div>
    );
  }

  if (!plan || !status) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-12">
        <h1 className="m-0 mb-3 font-display text-[26px] font-bold text-ink">วันนี้</h1>
        <ExamReminders />
        <UserExamReminders lessons={lessons} />
        <p className="m-0 mb-4 text-[15px] text-ink-2">ยังไม่มีแผนอ่านที่ใช้งานอยู่</p>
        <LinkButton href="/plan" variant="primary">
          ไปสร้างแผน
        </LinkButton>
      </div>
    );
  }

  const paceLabel =
    status.pace === "behind"
      ? `ช้ากว่าแผน ${status.paceDays} วัน`
      : status.pace === "ahead"
        ? `เร็วกว่าแผน ${status.paceDays} วัน`
        : "ตามแผน";

  const examMs = parseIsoDate(plan.examDate);
  const todayMs = parseIsoDate(todayIso);
  const daysToExam = Math.round((examMs - todayMs) / (24 * 60 * 60 * 1000));

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <header className="mb-8 border-b border-line pb-6">
        <Eyebrow>วันนี้</Eyebrow>
        <h1 className="m-0 mb-3 font-display text-[clamp(26px,4vw,38px)] font-bold tracking-tight text-ink">
          เหลืออีก {daysToExam} วันถึงวันสอบ
        </h1>
        <p className="m-0 text-[16px] leading-relaxed text-ink-2">
          เหลือ {status.remainingLessonsCount} บท {status.remainingMinutes} นาที
          {status.daysRemaining > 0
            ? ` — ถ้าเรียนวันละ ${status.minutesPerDayNeeded} นาทีจะทันพอดี`
            : ""}
        </p>
        <p
          className={cx(
            "m-0 mt-2 inline-block rounded-pill px-2.5 py-1 text-[12.5px] font-medium tabular-nums",
            status.pace === "behind"
              ? "bg-danger-soft text-ink"
              : status.pace === "ahead"
                ? "bg-ok-soft text-ink"
                : "bg-accent-soft text-ink",
          )}
        >
          {paceLabel}
        </p>
      </header>

      <ExamReminders />
      <UserExamReminders lessons={lessons} />

      <section>
        <h2 className="m-0 mb-3 font-display text-[18px] font-semibold text-ink">รายการของวันนี้</h2>
        {todayItems.length === 0 ? (
          <p className="m-0 rounded-card border border-dashed border-line-strong bg-surface-2 px-4 py-6 text-center text-[14px] text-ink-3">
            วันนี้ไม่มีรายการในแผน (อาจเป็นวันที่ตั้งไว้ว่างตอนสร้างแผน)
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {todayItems.map((it) => {
              const done = isItemDone(it, lessons, lessonProgress);
              return (
                <div
                  key={it.id}
                  className={cx(
                    "flex items-center gap-3 rounded-lg border p-3.5",
                    done ? "border-ok bg-ok-soft" : "border-line bg-surface",
                  )}
                >
                  <span className="min-w-0 flex-1 text-[15px] text-ink">
                    {done ? "✓ " : ""}
                    {it.title}
                    <span className="ml-2 text-[12px] tabular-nums text-ink-3">
                      {it.minutesPlanned} นาที
                    </span>
                  </span>
                  {!done ? (
                    <LinkButton href={`/lesson/${it.refId}`} variant="primary">
                      เริ่ม
                    </LinkButton>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link href="/plan" className="text-[13.5px] text-accent-ink no-underline hover:underline">
          ดูแผนทั้งหมด / จัดแผนใหม่ →
        </Link>
        <Link href="/tasks" className="text-[13.5px] text-accent-ink no-underline hover:underline">
          ดูงานที่ต้องทำทั้งหมด →
        </Link>
      </div>
    </div>
  );
}
