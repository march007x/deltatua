import { createClient } from "@/lib/supabase/client";

export interface ExamResultRecord {
  id: string;
  examId: string;
  score: number;
  maxScore: number;
  seconds: number;
  weakTopics: string[];
  takenAt: number;
}

const KEY = "delta-exam-results-v1";

/** อ่านผลข้อสอบทั้งหมดที่ยังค้างในเบราว์เซอร์นี้ — ใช้ทั้งตอนแขกอ่านกราฟและตอนรวมเข้าบัญชี */
export function readLocalExamResults(): ExamResultRecord[] {
  return readLocal();
}

function readLocal(): ExamResultRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ExamResultRecord[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(list: ExamResultRecord[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // เบราว์เซอร์บางตัวปิดการเก็บข้อมูลไว้ — ให้ใช้งานต่อได้โดยไม่บันทึก
  }
}

function appendLocal(record: ExamResultRecord) {
  writeLocal([...readLocal(), record]);
}

/** ลบผลข้อสอบที่ยังค้างอยู่ในเบราว์เซอร์นี้ทั้งหมด — ใช้คู่กับ deleteCloudExamResults() เสมอใน
 * reset() ไม่ใช้เดี่ยว ๆ เพราะลบแค่ local แล้วข้อมูลจะเด้งกลับมาจากคลาวด์ทันทีถ้าล็อกอินอยู่ */
export function clearLocalExamResults() {
  writeLocal([]);
}

/** ลบผลข้อสอบฝั่งคลาวด์ของผู้ใช้คนนี้ทั้งหมด — คู่กับ clearLocalExamResults() */
export async function deleteCloudExamResults(userId: string): Promise<{ ok: boolean }> {
  const supabase = createClient();
  if (!supabase) return { ok: false };
  const { error } = await supabase.from("exam_results").delete().eq("user_id", userId);
  return { ok: !error };
}

function removeLocal(id: string) {
  writeLocal(readLocal().filter((r) => r.id !== id));
}

interface ExamResultRow {
  id: string;
  user_id: string;
  exam_id: string;
  score: number;
  max_score: number;
  seconds: number;
  weak_topics: string[];
  taken_at: string;
}

function toRow(userId: string, r: ExamResultRecord): ExamResultRow {
  return {
    id: r.id,
    user_id: userId,
    exam_id: r.examId,
    score: r.score,
    max_score: r.maxScore,
    seconds: r.seconds,
    weak_topics: r.weakTopics,
    taken_at: new Date(r.takenAt).toISOString(),
  };
}

/** เขียนผลข้อสอบหนึ่งชุดขึ้นคลาวด์ — ใช้ id ที่สร้างจาก client + upsert กันซ้ำเมื่อกดส่งซ้ำตอนเน็ตหลุด */
export async function writeCloudExamResult(
  userId: string,
  record: ExamResultRecord,
): Promise<{ ok: boolean }> {
  const supabase = createClient();
  if (!supabase) return { ok: false };
  const { error } = await supabase
    .from("exam_results")
    .upsert(toRow(userId, record), { onConflict: "id" });
  return { ok: !error };
}

/**
 * บันทึกผลข้อสอบหนึ่งชุด — เขียนลง localStorage ก่อนเสมอกันข้อมูลหายถ้าปิดแท็บกลางคัน
 * ถ้าล็อกอินอยู่และเขียนคลาวด์สำเร็จค่อยลบออกจาก localStorage
 */
export async function recordExamResult(
  userId: string | null,
  record: ExamResultRecord,
): Promise<void> {
  appendLocal(record);
  if (!userId) return;
  const { ok } = await writeCloudExamResult(userId, record);
  if (ok) removeLocal(record.id);
}

/** เพดานแถวที่ดึงต่อครั้ง — ดูเหตุผลเดียวกับ MAX_CLOUD_ATTEMPTS ใน attempts.ts */
const MAX_CLOUD_EXAM_RESULTS = 500;

/** อ่านผลข้อสอบล่าสุดของผู้ใช้จากคลาวด์ (เรียงใหม่ไปเก่า) — ใช้วาดกราฟคะแนนข้อสอบตามเวลาและ
 * สรุปผลข้อสอบล่าสุดต่อชุด */
export async function readCloudExamResults(userId: string): Promise<ExamResultRecord[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("exam_results")
    .select("id, exam_id, score, max_score, seconds, weak_topics, taken_at")
    .eq("user_id", userId)
    .order("taken_at", { ascending: false })
    .limit(MAX_CLOUD_EXAM_RESULTS);
  if (error || !data) return [];
  return (data as ExamResultRow[]).map((row) => ({
    id: row.id,
    examId: row.exam_id,
    score: row.score,
    maxScore: row.max_score,
    seconds: row.seconds,
    weakTopics: row.weak_topics,
    takenAt: new Date(row.taken_at).getTime(),
  }));
}

/** รวมผลข้อสอบที่ยังค้างในเบราว์เซอร์เข้าบัญชี — เป็น log เหตุการณ์ดิบ อัปทุกอันที่ยังไม่เคยส่งสำเร็จ */
export async function mergeLocalExamResultsIntoCloud(
  userId: string,
): Promise<{ merged: number; allOk: boolean }> {
  const local = readLocal();
  if (local.length === 0) return { merged: 0, allOk: true };
  let merged = 0;
  let allOk = true;
  for (const record of local) {
    const { ok } = await writeCloudExamResult(userId, record);
    if (ok) {
      removeLocal(record.id);
      merged++;
    } else {
      allOk = false;
    }
  }
  return { merged, allOk };
}
