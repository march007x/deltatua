import { createClient } from "@/lib/supabase/client";

export type Priority = "low" | "medium" | "high";
export type TaskKind = "task" | "homework" | "exam";

export interface UserTask {
  id: string;
  title: string;
  note?: string;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  priority: Priority;
  kind: TaskKind;
  subject?: string;
  lessonId?: string;
  doneAt?: number;
  createdAt: number;
}

interface TaskRow {
  id: string;
  title: string;
  note: string | null;
  due_date: string | null;
  due_time: string | null;
  priority: Priority;
  kind: TaskKind;
  subject: string | null;
  lesson_id: string | null;
  done_at: string | null;
  created_at: string;
}

function rowToTask(row: TaskRow): UserTask {
  return {
    id: row.id,
    title: row.title,
    note: row.note ?? undefined,
    dueDate: row.due_date ?? undefined,
    dueTime: row.due_time ?? undefined,
    priority: row.priority,
    kind: row.kind,
    subject: row.subject ?? undefined,
    lessonId: row.lesson_id ?? undefined,
    doneAt: row.done_at ? new Date(row.done_at).getTime() : undefined,
    createdAt: new Date(row.created_at).getTime(),
  };
}

const SELECT_COLUMNS =
  "id, title, note, due_date, due_time, priority, kind, subject, lesson_id, done_at, created_at";

/** งานที่ผู้ใช้พิมพ์เอง (source='user') ทั้งหมด — งานที่ระบบสร้างจากแผนไม่อยู่ในตารางนี้ อ่านแยกจาก plan_items */
export async function listUserTasks(userId: string): Promise<UserTask[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("tasks")
    .select(SELECT_COLUMNS)
    .eq("user_id", userId)
    .eq("source", "user")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as TaskRow[]).map(rowToTask);
}

export async function createUserTask(
  userId: string,
  input: {
    title: string;
    note?: string;
    dueDate?: string;
    dueTime?: string;
    priority: Priority;
    kind?: TaskKind;
    subject?: string;
    lessonId?: string;
  },
): Promise<{ ok: boolean }> {
  const supabase = createClient();
  if (!supabase) return { ok: false };
  const { error } = await supabase.from("tasks").insert({
    user_id: userId,
    title: input.title,
    note: input.note ?? null,
    due_date: input.dueDate ?? null,
    due_time: input.dueTime ?? null,
    priority: input.priority,
    kind: input.kind ?? "task",
    subject: input.subject ?? null,
    lesson_id: input.lessonId ?? null,
    source: "user",
  });
  return { ok: !error };
}

export async function setUserTaskDone(taskId: string, done: boolean): Promise<{ ok: boolean }> {
  const supabase = createClient();
  if (!supabase) return { ok: false };
  const { error } = await supabase
    .from("tasks")
    .update({ done_at: done ? new Date().toISOString() : null })
    .eq("id", taskId);
  return { ok: !error };
}

export async function deleteUserTask(taskId: string): Promise<{ ok: boolean }> {
  const supabase = createClient();
  if (!supabase) return { ok: false };
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  return { ok: !error };
}
