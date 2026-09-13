import { createClient } from "@/lib/supabase/client";

export interface LessonProgress {
  status: "not_started" | "in_progress" | "completed";
  lastOpenedAt: number;
  completedAt?: number;
}

export type ProgressMap = Record<string, LessonProgress>;

const KEY = "delta-progress-v1";
const RANK: Record<LessonProgress["status"], number> = {
  not_started: 0,
  in_progress: 1,
  completed: 2,
};

/**
 * ชั้นเข้าถึงความก้าวหน้ารายบท — แขก (ไม่ล็อกอิน) ใช้ localStorage
 * สมาชิกใช้ตาราง lesson_progress บน Supabase แทน (เรียกผ่าน useProgress() ใน store.ts เท่านั้น)
 */
export function readLocal(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

export function writeLocal(map: ProgressMap) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    // เบราว์เซอร์บางตัวปิดการเก็บข้อมูลไว้ — ให้ใช้งานต่อได้โดยไม่บันทึก
  }
}

interface ProgressRow {
  lesson_id: string;
  status: LessonProgress["status"];
  started_at: string | null;
  completed_at: string | null;
}

function rowToProgress(row: ProgressRow): LessonProgress {
  return {
    status: row.status,
    lastOpenedAt: row.started_at ? new Date(row.started_at).getTime() : Date.now(),
    completedAt: row.completed_at ? new Date(row.completed_at).getTime() : undefined,
  };
}

export async function readCloud(userId: string): Promise<ProgressMap> {
  const supabase = createClient();
  if (!supabase) return {};
  const { data, error } = await supabase
    .from("lesson_progress")
    .select("lesson_id, status, started_at, completed_at")
    .eq("user_id", userId);
  if (error || !data) return {};
  const map: ProgressMap = {};
  for (const row of data as ProgressRow[]) map[row.lesson_id] = rowToProgress(row);
  return map;
}

export async function writeCloudOne(
  userId: string,
  lessonId: string,
  progress: LessonProgress,
): Promise<{ ok: boolean }> {
  const supabase = createClient();
  if (!supabase) return { ok: false };
  const { error } = await supabase.from("lesson_progress").upsert(
    {
      user_id: userId,
      lesson_id: lessonId,
      status: progress.status,
      started_at: new Date(progress.lastOpenedAt).toISOString(),
      completed_at: progress.completedAt ? new Date(progress.completedAt).toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" },
  );
  return { ok: !error };
}

export async function clearCloud(userId: string) {
  const supabase = createClient();
  if (!supabase) return;
  await supabase.from("lesson_progress").delete().eq("user_id", userId);
}

/**
 * รวมความก้าวหน้าจากเบราว์เซอร์นี้เข้าบัญชี — เก็บสถานะที่ก้าวหน้ากว่าไว้เสมอ ไม่เขียนทับของเดิมที่ดีกว่า
 * allOk เป็น false ถ้ามีบทไหนเขียนไม่สำเร็จ — ผู้เรียกต้องไม่ล้าง localStorage เมื่อ allOk เป็น false
 * เพราะข้อมูลนั้นยังไม่ถูกรวมเข้าบัญชีจริง
 */
export async function mergeLocalProgressIntoCloud(
  userId: string,
): Promise<{ merged: number; allOk: boolean }> {
  const local = readLocal();
  const lessonIds = Object.keys(local);
  if (lessonIds.length === 0) return { merged: 0, allOk: true };

  const cloud = await readCloud(userId);
  let merged = 0;
  let allOk = true;

  for (const lessonId of lessonIds) {
    const localProgress = local[lessonId]!;
    const cloudProgress = cloud[lessonId];
    if (!cloudProgress || RANK[localProgress.status] > RANK[cloudProgress.status]) {
      const { ok } = await writeCloudOne(userId, lessonId, {
        status: localProgress.status,
        lastOpenedAt: cloudProgress
          ? Math.max(localProgress.lastOpenedAt, cloudProgress.lastOpenedAt)
          : localProgress.lastOpenedAt,
        completedAt: localProgress.completedAt ?? cloudProgress?.completedAt,
      });
      if (ok) merged++;
      else allOk = false;
    }
  }
  return { merged, allOk };
}
