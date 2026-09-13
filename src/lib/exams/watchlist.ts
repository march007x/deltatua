import { createClient } from "@/lib/supabase/client";

/** exam id ทั้งหมดที่ผู้ใช้กดติดตามไว้ */
export async function listWatchedExamIds(userId: string): Promise<Set<string>> {
  const supabase = createClient();
  if (!supabase) return new Set();
  const { data, error } = await supabase.from("watchlist").select("exam_id").eq("user_id", userId);
  if (error || !data) return new Set();
  return new Set((data as Array<{ exam_id: string }>).map((r) => r.exam_id));
}

export async function watchExam(userId: string, examId: string): Promise<{ ok: boolean }> {
  const supabase = createClient();
  if (!supabase) return { ok: false };
  const { error } = await supabase
    .from("watchlist")
    .upsert({ user_id: userId, exam_id: examId }, { onConflict: "user_id,exam_id" });
  return { ok: !error };
}

export async function unwatchExam(userId: string, examId: string): Promise<{ ok: boolean }> {
  const supabase = createClient();
  if (!supabase) return { ok: false };
  const { error } = await supabase
    .from("watchlist")
    .delete()
    .eq("user_id", userId)
    .eq("exam_id", examId);
  return { ok: !error };
}
