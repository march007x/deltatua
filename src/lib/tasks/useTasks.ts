"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "@/components/auth/SessionProvider";
import { useProgress } from "@/lib/progress/store";
import { usePlanner } from "@/lib/planner/useActivePlan";
import { isItemDone } from "@/lib/planner/status";
import type { ProgressLesson } from "@/lib/repo/progress-index";
import {
  createUserTask,
  deleteUserTask,
  listUserTasks,
  setUserTaskDone,
  type Priority,
  type TaskKind,
  type UserTask,
} from "./data";
import { collectSubjects } from "./filter";

export interface UnifiedTask {
  id: string;
  /** ที่มาของงาน: พิมพ์เอง หรือระบบสร้างจากแผนอ่าน — คนละมิติกับ taskKind (ชนิดงาน) */
  source: "user" | "generated";
  title: string;
  dueDate?: string;
  dueTime?: string;
  priority?: Priority;
  /** มีเฉพาะงานที่พิมพ์เอง — งานจากแผนเป็นงาน "อ่านบท" เสมอ ไม่มีชนิด/วิชาให้จัด */
  taskKind?: TaskKind;
  subject?: string;
  note?: string;
  lessonSlug?: string;
  minutesPlanned?: number;
  done: boolean;
  overdue: boolean;
}

const todayIso = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());

/**
 * รวมงานสองชนิดเป็นรายการเดียว — งานที่ระบบสร้าง (source='generated') คำนวณสดจาก plan_items
 * ของวันนี้และวันที่ผ่านมาแต่ยังไม่เสร็จเท่านั้น (ไม่รวมอนาคต ซึ่งอยู่ในปฏิทิน /plan แทน)
 * งานที่ผู้ใช้พิมพ์เอง (source='user') มาจากตาราง tasks จริง
 */
export function useTasks(lessons: ProgressLesson[]) {
  const { user } = useSession();
  const userId = user?.id ?? null;
  const { toggleCompleted } = useProgress();
  const planner = usePlanner();

  const [userTasks, setUserTasks] = useState<UserTask[]>([]);
  const [ready, setReady] = useState(false);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!userId) {
      setUserTasks([]);
      setReady(true);
      return;
    }
    let cancelled = false;
    (async () => {
      const list = await listUserTasks(userId);
      if (!cancelled) {
        setUserTasks(list);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, version]);

  const generatedTasks: UnifiedTask[] = useMemo(() => {
    return planner.items
      .filter((it) => it.date <= todayIso)
      .filter((it) => !isItemDone(it, lessons, planner.lessonProgress))
      .map((it) => ({
        id: `plan:${it.id}`,
        source: "generated" as const,
        title: it.title,
        dueDate: it.date,
        lessonSlug: it.refId,
        minutesPlanned: it.minutesPlanned,
        done: false,
        overdue: it.date < todayIso,
      }));
  }, [planner.items, planner.lessonProgress, lessons]);

  const userUnified: UnifiedTask[] = useMemo(
    () =>
      userTasks.map((t) => ({
        id: t.id,
        source: "user" as const,
        title: t.title,
        dueDate: t.dueDate,
        dueTime: t.dueTime,
        priority: t.priority,
        taskKind: t.kind,
        subject: t.subject,
        note: t.note,
        lessonSlug: t.lessonId,
        done: t.doneAt !== undefined,
        overdue: !!t.dueDate && t.dueDate < todayIso && t.doneAt === undefined,
      })),
    [userTasks],
  );

  /** วิชาที่พบบ่อยรวมกับที่ผู้ใช้คนนี้เคยพิมพ์เอง (จากทุกงาน ไม่ใช่แค่แท็บที่กำลังดู) — ใช้เติม datalist ของฟอร์ม */
  const knownSubjects = useMemo(
    () => collectSubjects(userTasks.map((t) => t.subject)),
    [userTasks],
  );

  const today: UnifiedTask[] = useMemo(
    () => [...generatedTasks, ...userUnified.filter((t) => t.dueDate === todayIso && !t.done)],
    [generatedTasks, userUnified],
  );

  const upcoming: UnifiedTask[] = useMemo(
    () => userUnified.filter((t) => t.dueDate && t.dueDate > todayIso && !t.done),
    [userUnified],
  );

  const all: UnifiedTask[] = useMemo(
    () => [...generatedTasks, ...userUnified.filter((t) => !t.done)],
    [generatedTasks, userUnified],
  );

  const done: UnifiedTask[] = useMemo(() => userUnified.filter((t) => t.done), [userUnified]);

  const todayDoneCount = useMemo(() => {
    // นับเฉพาะงานที่ "ครบกำหนดวันนี้" ทั้งสองชนิด รวมทั้งที่เสร็จแล้ว เพื่อทำแถบสรุป X จาก Y
    const genToday = planner.items.filter((it) => it.date === todayIso);
    const genDoneToday = genToday.filter((it) => isItemDone(it, lessons, planner.lessonProgress));
    const userToday = userTasks.filter((t) => t.dueDate === todayIso);
    const userDoneToday = userToday.filter((t) => t.doneAt !== undefined);
    return {
      done: genDoneToday.length + userDoneToday.length,
      total: genToday.length + userToday.length,
    };
  }, [planner.items, planner.lessonProgress, lessons, userTasks]);

  const toggleGeneratedDone = useCallback(
    async (task: UnifiedTask) => {
      if (!task.lessonSlug) return;
      const lesson = lessons.find((l) => l.slug === task.lessonSlug);
      if (!lesson) return;
      toggleCompleted(lesson.id);
      planner.refresh();
    },
    [lessons, toggleCompleted, planner],
  );

  const toggleUserDone = useCallback(
    async (taskId: string, done: boolean) => {
      await setUserTaskDone(taskId, done);
      refresh();
    },
    [refresh],
  );

  const addTask = useCallback(
    async (input: {
      title: string;
      note?: string;
      dueDate?: string;
      dueTime?: string;
      priority: Priority;
      kind?: TaskKind;
      subject?: string;
      lessonId?: string;
    }) => {
      if (!userId) return { ok: false };
      const result = await createUserTask(userId, input);
      refresh();
      return result;
    },
    [userId, refresh],
  );

  const removeTask = useCallback(
    async (taskId: string) => {
      await deleteUserTask(taskId);
      refresh();
    },
    [refresh],
  );

  return {
    ready: ready && planner.ready,
    today,
    upcoming,
    all,
    done,
    todayDoneCount,
    knownSubjects,
    toggleGeneratedDone,
    toggleUserDone,
    addTask,
    removeTask,
  };
}
