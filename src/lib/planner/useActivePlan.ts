"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/components/auth/SessionProvider";
import { readCloud, type ProgressMap } from "@/lib/progress/cloud";
import type { ProgressLesson } from "@/lib/repo/progress-index";
import type { MinutesPerDay, PendingLesson, WeekdayKey } from "./generate";
import {
  addMinutesPerDay,
  createPlan,
  cutLessonFromPlan,
  getActivePlan,
  getPlanItems,
  moveItemToDate,
  pushPlanByDays,
  setWeekdayMinutes,
  type Plan,
  type PlanItem,
} from "./data";

export interface PlannerState {
  ready: boolean;
  userId: string | null;
  plan: Plan | null;
  items: PlanItem[];
  lessonProgress: ProgressMap;
}

/** บทที่ยังไม่ผ่าน (ไม่ใช่ completed ใน lesson_progress) ของสนามสอบหนึ่ง เรียงตามลำดับพื้นฐานเดิม */
export function buildPendingLessons(
  lessons: ProgressLesson[],
  lessonProgress: ProgressMap,
  courseSlug: string,
): PendingLesson[] {
  return lessons
    .filter((l) => l.courseSlug === courseSlug)
    .filter((l) => lessonProgress[l.id]?.status !== "completed")
    .map((l) => ({ slug: l.slug, title: l.title, estimatedMinutes: l.minutes }));
}

export function usePlanner(): PlannerState & {
  refresh: () => void;
  createNewPlan: (
    input: { targetExam: string; examDate: string; startDate: string; minutesPerDay: MinutesPerDay },
    lessons: ProgressLesson[],
  ) => Promise<{ ok: boolean; shortfallMinutes: number }>;
  moveItem: (itemId: string, date: string) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  replanPushDays: (days: number, lessons: ProgressLesson[]) => Promise<{ ok: boolean; shortfallMinutes: number }>;
  replanAddMinutes: (
    extraMinutes: number,
    lessons: ProgressLesson[],
  ) => Promise<{ ok: boolean; shortfallMinutes: number }>;
  setDayMinutes: (
    weekday: WeekdayKey,
    minutes: number,
    lessons: ProgressLesson[],
  ) => Promise<{ ok: boolean; shortfallMinutes: number }>;
} {
  const { user } = useSession();
  const userId = user?.id ?? null;
  const [state, setState] = useState<PlannerState>({
    ready: false,
    userId: null,
    plan: null,
    items: [],
    lessonProgress: {},
  });
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!userId) {
      setState({ ready: true, userId: null, plan: null, items: [], lessonProgress: {} });
      return;
    }
    let cancelled = false;
    (async () => {
      const [plan, lessonProgress] = await Promise.all([getActivePlan(userId), readCloud(userId)]);
      if (cancelled) return;
      const items = plan ? await getPlanItems(plan.id) : [];
      if (cancelled) return;
      setState({ ready: true, userId, plan, items, lessonProgress });
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, version]);

  const createNewPlan: ReturnType<typeof usePlanner>["createNewPlan"] = useCallback(
    async (input, lessons) => {
      if (!userId) return { ok: false, shortfallMinutes: 0 };
      const pending = buildPendingLessons(lessons, state.lessonProgress, input.targetExam);
      const result = await createPlan(userId, input, pending);
      refresh();
      return { ok: result.ok, shortfallMinutes: result.shortfallMinutes };
    },
    [userId, state.lessonProgress, refresh],
  );

  const moveItem = useCallback(
    async (itemId: string, date: string) => {
      await moveItemToDate(itemId, date);
      refresh();
    },
    [refresh],
  );

  const removeItemAction = useCallback(
    async (itemId: string) => {
      await cutLessonFromPlan(itemId);
      refresh();
    },
    [refresh],
  );

  const todayIso = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());

  const replanPushDays = useCallback(
    async (days: number, lessons: ProgressLesson[]) => {
      if (!state.plan) return { ok: false, shortfallMinutes: 0 };
      const pending = buildPendingLessons(lessons, state.lessonProgress, state.plan.targetExam);
      const result = await pushPlanByDays(state.plan, pending, days, todayIso);
      refresh();
      return result;
    },
    [state.plan, state.lessonProgress, todayIso, refresh],
  );

  const replanAddMinutes = useCallback(
    async (extraMinutes: number, lessons: ProgressLesson[]) => {
      if (!state.plan) return { ok: false, shortfallMinutes: 0 };
      const pending = buildPendingLessons(lessons, state.lessonProgress, state.plan.targetExam);
      const result = await addMinutesPerDay(state.plan, pending, extraMinutes, todayIso);
      refresh();
      return result;
    },
    [state.plan, state.lessonProgress, todayIso, refresh],
  );

  const setDayMinutes = useCallback(
    async (weekday: WeekdayKey, minutes: number, lessons: ProgressLesson[]) => {
      if (!state.plan) return { ok: false, shortfallMinutes: 0 };
      const pending = buildPendingLessons(lessons, state.lessonProgress, state.plan.targetExam);
      const result = await setWeekdayMinutes(state.plan, pending, weekday, minutes, todayIso);
      refresh();
      return result;
    },
    [state.plan, state.lessonProgress, todayIso, refresh],
  );

  return {
    ...state,
    refresh,
    createNewPlan,
    moveItem,
    removeItem: removeItemAction,
    replanPushDays,
    replanAddMinutes,
    setDayMinutes,
  };
}
