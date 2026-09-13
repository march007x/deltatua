"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/components/auth/SessionProvider";
import {
  clearLocalExamResults,
  deleteCloudExamResults,
  readCloudExamResults,
  readLocalExamResults,
  type ExamResultRecord,
} from "@/lib/events/examResults";

export interface ExamResult {
  correct: number;
  total: number;
  spentSeconds: number;
  /** บทที่ทำได้ต่ำกว่า 70% ในรอบนั้น — ใช้ชี้ว่าควรกลับไปทบทวนอะไรก่อน */
  weakChapters: string[];
  at: number;
}

export type ExamMap = Record<string, ExamResult>;

function dedupeById(cloud: ExamResultRecord[], local: ExamResultRecord[]): ExamResultRecord[] {
  const byId = new Map<string, ExamResultRecord>();
  for (const r of local) byId.set(r.id, r);
  for (const r of cloud) byId.set(r.id, r);
  return [...byId.values()];
}

/** exam_results หนึ่งแถวคือหนึ่งครั้งที่ทำจบพอดีอยู่แล้ว (ไม่เหมือน attempts ที่เป็นรายข้อ)
 * จึงแค่เลือกแถวที่ takenAt ล่าสุดของแต่ละ examId ไม่ต้องจัดกลุ่มเป็นรอบเหมือนฝั่งฝึก */
export function computeExamMap(results: ExamResultRecord[]): ExamMap {
  const map: ExamMap = {};
  for (const r of results) {
    const existing = map[r.examId];
    if (existing && existing.at >= r.takenAt) continue;
    map[r.examId] = {
      correct: r.score,
      total: r.maxScore,
      spentSeconds: r.seconds,
      weakChapters: r.weakTopics,
      at: r.takenAt,
    };
  }
  return map;
}

/**
 * อ่านผลข้อสอบจำลองล่าสุดต่อชุด — แขกอ่านจาก localStorage อย่างเดียว สมาชิกอ่านจากคลาวด์ผสมกับ
 * ที่ยังค้างส่งไม่สำเร็จ (ตารางเดียวกับที่ P2 สร้างไว้ ไม่มีตารางสรุปแยก) ไม่มี save() แยกอีกต่อไป
 * เพราะ ExamRunner บันทึกผ่าน recordExamResult() อยู่แล้วตั้งแต่ P2 — เรียก refresh() หลังส่งคำตอบ
 */
export function useExamResults() {
  const { user, mergeVersion } = useSession();
  const userId = user?.id ?? null;
  const [map, setMap] = useState<ExamMap>({});
  const [ready, setReady] = useState(false);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    (async () => {
      const cloud = userId ? await readCloudExamResults(userId) : [];
      if (cancelled) return;
      setMap(computeExamMap(dedupeById(cloud, readLocalExamResults())));
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, mergeVersion, version]);

  /** ลบผลข้อสอบทั้งฝั่งเบราว์เซอร์นี้และฝั่งคลาวด์ (ถ้าล็อกอินอยู่) — ดูเหตุผลเดียวกับ reset()
   * ใน usePracticeResults() ของ practice.ts */
  const reset = useCallback(async () => {
    clearLocalExamResults();
    if (userId) await deleteCloudExamResults(userId);
    refresh();
  }, [refresh, userId]);

  return { map, ready, refresh, reset };
}
