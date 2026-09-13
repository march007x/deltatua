import type { ProgressMap } from "@/lib/progress/cloud";
import type { ProgressLesson } from "@/lib/repo/progress-index";
import { DAY_MS, parseIsoDate } from "./generate";
import type { PlanItem } from "./data";

/** สถานะ "เสร็จ" ของรายการชนิดบทเรียนต้องอ้างอิงความก้าวหน้าจริงเสมอ ไม่ใช่ plan_items.status
 * ที่ผู้ใช้ติ๊กเอง (ยังไม่มีปุ่มติ๊กแยกในหน้านี้เลยด้วยเหตุผลเดียวกัน) */
export function isItemDone(
  item: PlanItem,
  lessons: ProgressLesson[],
  lessonProgress: ProgressMap,
): boolean {
  if (item.kind !== "lesson") return item.status === "done";
  const lesson = lessons.find((l) => l.slug === item.refId);
  if (!lesson) return false;
  return lessonProgress[lesson.id]?.status === "completed";
}

export interface PlanStatus {
  daysRemaining: number;
  remainingLessonsCount: number;
  remainingMinutes: number;
  /** เรียนวันละเท่านี้จะทันพอดีวันสอบ — คำนวณจากข้อมูลจริงเท่านั้น */
  minutesPerDayNeeded: number;
  pace: "on_track" | "behind" | "ahead";
  /** จำนวนวันที่ช้า/เร็วกว่าแผน — 0 เมื่อ pace เป็น on_track */
  paceDays: number;
}

/**
 * สรุปสถานะเทียบกับแผน — คำนวณสดทุกครั้งจาก plan_items + lesson_progress จริง
 * "ช้ากว่าแผน n วัน" นับจากจำนวนวันในอดีตที่ยังมีรายการค้างอยู่อย่างน้อยหนึ่งรายการ
 * "เร็วกว่าแผน n วัน" นับจากจำนวนวันในอนาคตที่ทำครบทุกรายการไปล่วงหน้าแล้ว
 */
export function computePlanStatus(
  items: PlanItem[],
  lessons: ProgressLesson[],
  lessonProgress: ProgressMap,
  examDate: string,
  todayIso: string,
): PlanStatus {
  const todayMs = parseIsoDate(todayIso);
  const examMs = parseIsoDate(examDate);
  const daysRemaining = Math.max(0, Math.round((examMs - todayMs) / DAY_MS));

  const doneMap = new Map(items.map((it) => [it.id, isItemDone(it, lessons, lessonProgress)]));
  const notDoneItems = items.filter((it) => !doneMap.get(it.id));

  const remainingMinutes = notDoneItems.reduce((sum, it) => sum + it.minutesPlanned, 0);
  const remainingLessonsCount = new Set(notDoneItems.map((it) => it.refId)).size;
  const minutesPerDayNeeded =
    daysRemaining > 0 ? Math.ceil(remainingMinutes / daysRemaining) : remainingMinutes;

  const overdueDates = new Set(
    notDoneItems.filter((it) => parseIsoDate(it.date) < todayMs).map((it) => it.date),
  );

  const futureByDate = new Map<string, PlanItem[]>();
  for (const it of items) {
    if (parseIsoDate(it.date) > todayMs) {
      const list = futureByDate.get(it.date) ?? [];
      list.push(it);
      futureByDate.set(it.date, list);
    }
  }
  let aheadDays = 0;
  for (const list of futureByDate.values()) {
    if (list.every((it) => doneMap.get(it.id))) aheadDays++;
  }

  const base = { daysRemaining, remainingLessonsCount, remainingMinutes, minutesPerDayNeeded };
  if (overdueDates.size > 0) return { ...base, pace: "behind", paceDays: overdueDates.size };
  if (aheadDays > 0) return { ...base, pace: "ahead", paceDays: aheadDays };
  return { ...base, pace: "on_track", paceDays: 0 };
}
