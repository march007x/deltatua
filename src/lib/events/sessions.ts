import { createClient } from "@/lib/supabase/client";

export type StudySource = "lesson" | "practice" | "exam";

export interface StudySessionRecord {
  id: string;
  source: StudySource;
  refId: string;
  minutes: number;
  startedAt: number;
  endedAt: number;
}

const KEY = "delta-study-sessions-v1";

/** อ่าน study_sessions ทั้งหมดที่ยังค้างในเบราว์เซอร์นี้ — ใช้ทั้งตอนแขกอ่านกราฟและตอนรวมเข้าบัญชี */
export function readLocalSessions(): StudySessionRecord[] {
  return readLocal();
}

function readLocal(): StudySessionRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StudySessionRecord[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(list: StudySessionRecord[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // เบราว์เซอร์บางตัวปิดการเก็บข้อมูลไว้ — ให้ใช้งานต่อได้โดยไม่บันทึก
  }
}

function appendLocal(record: StudySessionRecord) {
  writeLocal([...readLocal(), record]);
}

function removeLocal(id: string) {
  writeLocal(readLocal().filter((r) => r.id !== id));
}

interface StudySessionRow {
  id: string;
  user_id: string;
  source: StudySource;
  ref_id: string;
  minutes: number;
  started_at: string;
  ended_at: string;
}

function toRow(userId: string, r: StudySessionRecord): StudySessionRow {
  return {
    id: r.id,
    user_id: userId,
    source: r.source,
    ref_id: r.refId,
    minutes: r.minutes,
    started_at: new Date(r.startedAt).toISOString(),
    ended_at: new Date(r.endedAt).toISOString(),
  };
}

/** เขียนหนึ่งช่วงเวลาเรียนขึ้นคลาวด์ — ใช้ id ที่สร้างจาก client + upsert กันซ้ำเมื่อกดส่งซ้ำตอนเน็ตหลุด */
export async function writeCloudSession(
  userId: string,
  record: StudySessionRecord,
): Promise<{ ok: boolean }> {
  const supabase = createClient();
  if (!supabase) return { ok: false };
  const { error } = await supabase
    .from("study_sessions")
    .upsert(toRow(userId, record), { onConflict: "id" });
  return { ok: !error };
}

/**
 * บันทึกหนึ่งช่วงเวลาเรียน — เขียนลง localStorage ก่อนเสมอกันข้อมูลหายถ้าปิดแท็บกลางคัน
 * ถ้าล็อกอินอยู่และเขียนคลาวด์สำเร็จค่อยลบออกจาก localStorage
 */
export async function recordStudySession(
  userId: string | null,
  record: StudySessionRecord,
): Promise<void> {
  appendLocal(record);
  if (!userId) return;
  const { ok } = await writeCloudSession(userId, record);
  if (ok) removeLocal(record.id);
}

/** เพดานแถวที่ดึงต่อครั้ง — ดูเหตุผลเดียวกับ MAX_CLOUD_ATTEMPTS ใน attempts.ts */
const MAX_CLOUD_SESSIONS = 1000;

/** อ่าน study_sessions ล่าสุดของผู้ใช้จากคลาวด์ (เรียงใหม่ไปเก่า) — ใช้วาดกราฟเวลาเรียน */
export async function readCloudSessions(userId: string): Promise<StudySessionRecord[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("study_sessions")
    .select("id, source, ref_id, minutes, started_at, ended_at")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(MAX_CLOUD_SESSIONS);
  if (error || !data) return [];
  return (data as StudySessionRow[]).map((row) => ({
    id: row.id,
    source: row.source,
    refId: row.ref_id,
    minutes: row.minutes,
    startedAt: new Date(row.started_at).getTime(),
    endedAt: new Date(row.ended_at).getTime(),
  }));
}

/** รวม study_sessions ที่ยังค้างในเบราว์เซอร์เข้าบัญชี — เป็น log เหตุการณ์ดิบ อัปทุกอันที่ยังไม่เคยส่งสำเร็จ */
export async function mergeLocalSessionsIntoCloud(
  userId: string,
): Promise<{ merged: number; allOk: boolean }> {
  const local = readLocal();
  if (local.length === 0) return { merged: 0, allOk: true };
  let merged = 0;
  let allOk = true;
  for (const record of local) {
    const { ok } = await writeCloudSession(userId, record);
    if (ok) {
      removeLocal(record.id);
      merged++;
    } else {
      allOk = false;
    }
  }
  return { merged, allOk };
}
