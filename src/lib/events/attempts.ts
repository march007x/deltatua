import { createClient } from "@/lib/supabase/client";

export interface AttemptRecord {
  id: string;
  questionId: string;
  lessonId: string;
  examId?: string;
  isCorrect: boolean;
  seconds: number;
  createdAt: number;
}

const KEY = "delta-attempts-v1";

/** อ่าน attempts ทั้งหมดที่ยังค้างในเบราว์เซอร์นี้ — ใช้ทั้งตอนแขกอ่านกราฟและตอนรวมเข้าบัญชี */
export function readLocalAttempts(): AttemptRecord[] {
  return readLocal();
}

function readLocal(): AttemptRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AttemptRecord[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(list: AttemptRecord[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // เบราว์เซอร์บางตัวปิดการเก็บข้อมูลไว้ — ให้ใช้งานต่อได้โดยไม่บันทึก
  }
}

function appendLocal(record: AttemptRecord) {
  writeLocal([...readLocal(), record]);
}

function removeLocal(id: string) {
  writeLocal(readLocal().filter((r) => r.id !== id));
}

/** ลบ attempts จากโหมดฝึก (ไม่มี examId) ที่ยังค้างอยู่ในเบราว์เซอร์นี้ — ใช้คู่กับ
 * deleteCloudPracticeAttempts() เสมอใน reset() ไม่ใช้เดี่ยว ๆ เพราะลบแค่ local แล้วข้อมูลจะ
 * เด้งกลับมาจากคลาวด์ทันทีถ้าผู้ใช้ล็อกอินอยู่ */
export function clearLocalPracticeAttempts() {
  writeLocal(readLocal().filter((r) => !!r.examId));
}

/** ลบ attempts จากโหมดฝึก (ไม่มี examId) ฝั่งคลาวด์ของผู้ใช้คนนี้ทั้งหมด — คู่กับ
 * clearLocalPracticeAttempts() ไม่แตะ attempts ที่มาจากข้อสอบจำลอง (มี examId) */
export async function deleteCloudPracticeAttempts(userId: string): Promise<{ ok: boolean }> {
  const supabase = createClient();
  if (!supabase) return { ok: false };
  const { error } = await supabase
    .from("attempts")
    .delete()
    .eq("user_id", userId)
    .is("exam_id", null);
  return { ok: !error };
}

interface AttemptRow {
  id: string;
  user_id: string;
  question_id: string;
  lesson_id: string;
  exam_id: string | null;
  is_correct: boolean;
  seconds: number;
  created_at: string;
}

function toRow(userId: string, r: AttemptRecord): AttemptRow {
  return {
    id: r.id,
    user_id: userId,
    question_id: r.questionId,
    lesson_id: r.lessonId,
    exam_id: r.examId ?? null,
    is_correct: r.isCorrect,
    seconds: r.seconds,
    created_at: new Date(r.createdAt).toISOString(),
  };
}

/** เขียนหนึ่งครั้งที่ตอบโจทย์ขึ้นคลาวด์ — ใช้ id ที่สร้างจาก client + upsert กันซ้ำเมื่อกดส่งซ้ำตอนเน็ตหลุด */
export async function writeCloudAttempt(
  userId: string,
  record: AttemptRecord,
): Promise<{ ok: boolean }> {
  const supabase = createClient();
  if (!supabase) return { ok: false };
  const { error } = await supabase
    .from("attempts")
    .upsert(toRow(userId, record), { onConflict: "id" });
  return { ok: !error };
}

/**
 * บันทึกหนึ่งครั้งที่ตอบโจทย์ — เขียนลง localStorage ก่อนเสมอกันข้อมูลหายถ้าปิดแท็บกลางคัน
 * ถ้าล็อกอินอยู่และเขียนคลาวด์สำเร็จค่อยลบออกจาก localStorage · โหมดแขกหรือเขียนคลาวด์ไม่สำเร็จ
 * จะยังค้างไว้ในเบราว์เซอร์แล้วถูกรวมเข้าบัญชีอัตโนมัติตอนล็อกอินครั้งถัดไป
 */
export async function recordAttempt(userId: string | null, record: AttemptRecord): Promise<void> {
  appendLocal(record);
  if (!userId) return;
  const { ok } = await writeCloudAttempt(userId, record);
  if (ok) removeLocal(record.id);
}

/** เพดานแถวที่ดึงต่อครั้ง — PostgREST มีเพดานแถวของตัวเองอยู่แล้ว (ปกติ 1000) ถ้าไม่กำหนด order
 * ให้ชัดเจน แถวที่ถูกตัดทิ้งเมื่อเกินเพดานจะไม่แน่ว่าเป็นแถวไหน ทำให้ "รอบล่าสุด" หายไปแบบไม่มี error
 * ให้เห็น — ใส่ order+limit เองเพื่อรับประกันว่าถ้าต้องตัดจริง จะตัดแถวที่เก่าที่สุดทิ้งก่อนเสมอ */
const MAX_CLOUD_ATTEMPTS = 2000;

/** อ่าน attempts ล่าสุดของผู้ใช้จากคลาวด์ (เรียงใหม่ไปเก่า) — ใช้ทั้งวาดกราฟความแม่นยำและสรุปผล
 * ฝึกล่าสุดต่อบท ทั้งสองอย่างสนใจเหตุการณ์ล่าสุดเป็นหลัก จึงพอกันด้วยเพดานเดียว */
export async function readCloudAttempts(userId: string): Promise<AttemptRecord[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("attempts")
    .select("id, question_id, lesson_id, exam_id, is_correct, seconds, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(MAX_CLOUD_ATTEMPTS);
  if (error || !data) return [];
  return (data as AttemptRow[]).map((row) => ({
    id: row.id,
    questionId: row.question_id,
    lessonId: row.lesson_id,
    examId: row.exam_id ?? undefined,
    isCorrect: row.is_correct,
    seconds: row.seconds,
    createdAt: new Date(row.created_at).getTime(),
  }));
}

/** รวม attempts ที่ยังค้างในเบราว์เซอร์เข้าบัญชี — เป็น log เหตุการณ์ดิบ อัปทุกอันที่ยังไม่เคยส่งสำเร็จ */
export async function mergeLocalAttemptsIntoCloud(
  userId: string,
): Promise<{ merged: number; allOk: boolean }> {
  const local = readLocal();
  if (local.length === 0) return { merged: 0, allOk: true };
  let merged = 0;
  let allOk = true;
  for (const record of local) {
    const { ok } = await writeCloudAttempt(userId, record);
    if (ok) {
      removeLocal(record.id);
      merged++;
    } else {
      allOk = false;
    }
  }
  return { merged, allOk };
}
