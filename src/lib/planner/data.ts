import { createClient } from "@/lib/supabase/client";
import {
  formatIsoDate,
  generatePlan,
  parseIsoDate,
  type MinutesPerDay,
  type PendingLesson,
} from "./generate";

export interface Plan {
  id: string;
  userId: string;
  targetExam: string;
  examDate: string;
  startDate: string;
  minutesPerDay: MinutesPerDay;
  status: "active" | "completed" | "abandoned";
  createdAt: number;
}

export interface PlanItem {
  id: string;
  planId: string;
  date: string;
  kind: "lesson" | "practice" | "exam";
  refId: string;
  title: string;
  minutesPlanned: number;
  status: "pending" | "done" | "skipped";
  doneAt?: number;
  sortOrder: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

interface PlanRow {
  id: string;
  user_id: string;
  target_exam: string;
  exam_date: string;
  start_date: string;
  minutes_per_day: MinutesPerDay;
  status: Plan["status"];
  created_at: string;
}

interface PlanItemRow {
  id: string;
  plan_id: string;
  date: string;
  kind: PlanItem["kind"];
  ref_id: string;
  title: string;
  minutes_planned: number;
  status: PlanItem["status"];
  done_at: string | null;
  sort_order: number;
}

function rowToPlan(row: PlanRow): Plan {
  return {
    id: row.id,
    userId: row.user_id,
    targetExam: row.target_exam,
    examDate: row.exam_date,
    startDate: row.start_date,
    minutesPerDay: row.minutes_per_day,
    status: row.status,
    createdAt: new Date(row.created_at).getTime(),
  };
}

function rowToItem(row: PlanItemRow): PlanItem {
  return {
    id: row.id,
    planId: row.plan_id,
    date: row.date,
    kind: row.kind,
    refId: row.ref_id,
    title: row.title,
    minutesPlanned: row.minutes_planned,
    status: row.status,
    doneAt: row.done_at ? new Date(row.done_at).getTime() : undefined,
    sortOrder: row.sort_order,
  };
}

/** แผนล่าสุดที่ยัง active อยู่ของผู้ใช้ (คนหนึ่งใช้งานจริงทีละแผน แม้ประวัติเก่าจะเก็บไว้ก็ตาม) */
export async function getActivePlan(userId: string): Promise<Plan | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("plans")
    .select("id, user_id, target_exam, exam_date, start_date, minutes_per_day, status, created_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return rowToPlan(data as PlanRow);
}

export async function getPlanItems(planId: string): Promise<PlanItem[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("plan_items")
    .select("id, plan_id, date, kind, ref_id, title, minutes_planned, status, done_at, sort_order")
    .eq("plan_id", planId)
    .order("date", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error || !data) return [];
  return (data as PlanItemRow[]).map(rowToItem);
}

/** เลิกใช้แผนเก่า (ไม่ลบ เก็บประวัติไว้) ก่อนสร้างแผนใหม่แทน */
async function abandonActivePlan(userId: string): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;
  await supabase
    .from("plans")
    .update({ status: "abandoned" })
    .eq("user_id", userId)
    .eq("status", "active");
}

/** สร้างแผนใหม่จากคำตอบ 3 ข้อ + รายการบทที่ยังไม่ผ่าน แล้วจัดวันให้ทันที */
export async function createPlan(
  userId: string,
  input: { targetExam: string; examDate: string; startDate: string; minutesPerDay: MinutesPerDay },
  pendingLessons: PendingLesson[],
): Promise<{ ok: boolean; plan?: Plan; shortfallMinutes: number }> {
  const supabase = createClient();
  if (!supabase) return { ok: false, shortfallMinutes: 0 };

  await abandonActivePlan(userId);

  const { data: planRow, error: planError } = await supabase
    .from("plans")
    .insert({
      user_id: userId,
      target_exam: input.targetExam,
      exam_date: input.examDate,
      start_date: input.startDate,
      minutes_per_day: input.minutesPerDay,
      status: "active",
    })
    .select("id, user_id, target_exam, exam_date, start_date, minutes_per_day, status, created_at")
    .single();

  if (planError || !planRow) return { ok: false, shortfallMinutes: 0 };
  const plan = rowToPlan(planRow as PlanRow);

  const { items, shortfallMinutes } = generatePlan(
    input.startDate,
    input.examDate,
    input.minutesPerDay,
    pendingLessons,
  );

  if (items.length > 0) {
    const { error: itemsError } = await supabase.from("plan_items").insert(
      items.map((it) => ({
        plan_id: plan.id,
        user_id: userId,
        date: it.date,
        kind: it.kind,
        ref_id: it.refId,
        title: it.title,
        minutes_planned: it.minutesPlanned,
        sort_order: it.sortOrder,
      })),
    );
    if (itemsError) return { ok: false, plan, shortfallMinutes };
  }

  return { ok: true, plan, shortfallMinutes };
}

/** ย้ายรายการหนึ่งไปอีกวัน — ใช้ตอนลากเลื่อนรายการข้ามวันในหน้า /plan */
export async function moveItemToDate(itemId: string, date: string): Promise<{ ok: boolean }> {
  const supabase = createClient();
  if (!supabase) return { ok: false };
  const { error } = await supabase.from("plan_items").update({ date }).eq("id", itemId);
  return { ok: !error };
}

/** ตัดรายการหนึ่งออกจากแผน — ไม่จัดเรียงรายการที่เหลือใหม่ให้อัตโนมัติ */
export async function removeItem(itemId: string): Promise<{ ok: boolean }> {
  const supabase = createClient();
  if (!supabase) return { ok: false };
  const { error } = await supabase.from("plan_items").delete().eq("id", itemId);
  return { ok: !error };
}

/**
 * จัดแผนใหม่เมื่อตามไม่ทัน — ลบเฉพาะรายการของแผนเดิมที่ยังไม่ผ่านจริง (อ้างจาก pendingLessons
 * ที่ผู้เรียกกรองจาก lesson_progress มาแล้ว) แล้วจัดใหม่ด้วย generatePlan() ตัวเดียวกับตอนสร้างแผนครั้งแรก
 *
 * ห้ามใช้ plan_items.status = 'pending' เป็นตัวกรองว่าจะลบอะไร เพราะคอลัมน์นี้ไม่เคยถูกอัปเดต
 * เป็น 'done' ที่ไหนในโปรเจกต์เลย (isItemDone() เช็คจาก lesson_progress เสมอ ไม่ใช่คอลัมน์นี้)
 * ถ้ากรองด้วย status จะเท่ากับลบทุกแถวรวมถึงบทที่เรียนจบไปแล้วด้วย ขัดกับที่ตั้งใจว่าจะเก็บไว้
 */
async function regenerateRemaining(
  plan: Plan,
  pendingLessons: PendingLesson[],
  opts: { startDate: string; minutesPerDay: MinutesPerDay },
): Promise<{ ok: boolean; shortfallMinutes: number }> {
  const supabase = createClient();
  if (!supabase) return { ok: false, shortfallMinutes: 0 };

  const { data: currentItems, error: readError } = await supabase
    .from("plan_items")
    .select("id, ref_id")
    .eq("plan_id", plan.id);
  if (readError) return { ok: false, shortfallMinutes: 0 };

  const pendingSlugs = new Set(pendingLessons.map((l) => l.slug));
  const idsToDelete = ((currentItems ?? []) as Array<{ id: string; ref_id: string }>)
    .filter((row) => pendingSlugs.has(row.ref_id))
    .map((row) => row.id);

  if (idsToDelete.length > 0) {
    const { error: deleteError } = await supabase.from("plan_items").delete().in("id", idsToDelete);
    if (deleteError) return { ok: false, shortfallMinutes: 0 };
  }

  if (
    opts.minutesPerDay.mon !== plan.minutesPerDay.mon ||
    JSON.stringify(opts.minutesPerDay) !== JSON.stringify(plan.minutesPerDay)
  ) {
    await supabase.from("plans").update({ minutes_per_day: opts.minutesPerDay }).eq("id", plan.id);
  }

  const { items, shortfallMinutes } = generatePlan(
    opts.startDate,
    plan.examDate,
    opts.minutesPerDay,
    pendingLessons,
  );

  if (items.length > 0) {
    const { error: insertError } = await supabase.from("plan_items").insert(
      items.map((it) => ({
        plan_id: plan.id,
        user_id: plan.userId,
        date: it.date,
        kind: it.kind,
        ref_id: it.refId,
        title: it.title,
        minutes_planned: it.minutesPlanned,
        sort_order: it.sortOrder,
      })),
    );
    if (insertError) return { ok: false, shortfallMinutes };
  }

  return { ok: true, shortfallMinutes };
}

/** ทางเลือกที่ 1 เมื่อตามไม่ทัน: เลื่อนจุดเริ่มจัดตารางที่เหลือไปข้างหน้า n วันจากวันนี้ */
export async function pushPlanByDays(
  plan: Plan,
  pendingLessons: PendingLesson[],
  days: number,
  todayIso: string,
): Promise<{ ok: boolean; shortfallMinutes: number }> {
  const newStart = formatIsoDate(parseIsoDate(todayIso) + days * DAY_MS);
  return regenerateRemaining(plan, pendingLessons, {
    startDate: newStart,
    minutesPerDay: plan.minutesPerDay,
  });
}

/** ทางเลือกที่ 2 เมื่อตามไม่ทัน: เพิ่มเวลาว่างทุกวันแล้วจัดตารางที่เหลือใหม่จากวันนี้ */
export async function addMinutesPerDay(
  plan: Plan,
  pendingLessons: PendingLesson[],
  extraMinutes: number,
  todayIso: string,
): Promise<{ ok: boolean; shortfallMinutes: number }> {
  const nextMinutesPerDay = Object.fromEntries(
    Object.entries(plan.minutesPerDay).map(([k, v]) => [k, v + extraMinutes]),
  ) as MinutesPerDay;
  return regenerateRemaining(plan, pendingLessons, {
    startDate: todayIso,
    minutesPerDay: nextMinutesPerDay,
  });
}

/** ทางเลือกที่ 3 เมื่อตามไม่ทัน: ตัดบทหนึ่งออกจากแผน (ใช้ removeItem กับรายการที่ยังไม่เสร็จ) */
export { removeItem as cutLessonFromPlan };

/** ปิด/เปิดวันหนึ่งในสัปดาห์ (ตั้งเวลาว่างวันนั้นเป็น 0 หรือคืนค่าเดิม) แล้วจัดตารางที่เหลือใหม่จากวันนี้ */
export async function setWeekdayMinutes(
  plan: Plan,
  pendingLessons: PendingLesson[],
  weekday: keyof MinutesPerDay,
  minutes: number,
  todayIso: string,
): Promise<{ ok: boolean; shortfallMinutes: number }> {
  const nextMinutesPerDay = { ...plan.minutesPerDay, [weekday]: minutes };
  return regenerateRemaining(plan, pendingLessons, {
    startDate: todayIso,
    minutesPerDay: nextMinutesPerDay,
  });
}
