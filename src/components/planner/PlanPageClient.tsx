"use client";

import type { Course } from "@/content/schema";
import type { ProgressLesson } from "@/lib/repo/progress-index";
import { usePlanner } from "@/lib/planner/useActivePlan";
import { PlanWizard } from "./PlanWizard";
import { PlanBoard } from "./PlanBoard";
import { Eyebrow } from "@/components/ui/Eyebrow";

export function PlanPageClient({
  courses,
  lessons,
}: {
  courses: Course[];
  lessons: ProgressLesson[];
}) {
  const planner = usePlanner();

  if (!planner.ready) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-12">
        <p className="m-0 rounded-card border border-dashed border-line-strong bg-surface-2 px-4 py-8 text-center text-[14px] text-ink-3">
          กำลังโหลด…
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <header className="mb-8 border-b border-line pb-6">
        <Eyebrow>จัดตารางอ่านให้เอง</Eyebrow>
        <h1 className="m-0 mb-3 font-display text-[clamp(26px,4vw,38px)] font-bold tracking-tight text-ink">
          วางแผนอ่านหนังสือ
        </h1>
        <p className="m-0 max-w-[62ch] text-[15px] leading-relaxed text-ink-2">
          ตอบ 3 คำถาม ระบบจะไล่บทที่ยังไม่ผ่านตามลำดับพื้นฐานจริง แล้วจัดลงวันตามเวลาว่างที่มีให้เอง
        </p>
      </header>

      {planner.plan ? (
        <PlanBoard planner={planner} lessons={lessons} />
      ) : (
        <PlanWizard courses={courses} lessons={lessons} onCreate={planner.createNewPlan} />
      )}
    </div>
  );
}
