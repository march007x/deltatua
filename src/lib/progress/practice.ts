"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/components/auth/SessionProvider";
import {
  clearLocalPracticeAttempts,
  deleteCloudPracticeAttempts,
  readCloudAttempts,
  readLocalAttempts,
  type AttemptRecord,
} from "@/lib/events/attempts";

export interface PracticeResult {
  /** จำนวนข้อที่ตอบถูกในรอบล่าสุด */
  correct: number;
  /** จำนวนข้อที่ตอบไปแล้วในรอบล่าสุด — อาจน้อยกว่าจำนวนข้อทั้งหมดของชุดถ้ายังทำไม่จบ */
  total: number;
  /** จำนวนข้อทั้งหมดของชุดฝึกบทนี้ (จาก getPracticeIndex()/quizCount ไม่ใช่คอลัมน์ในฐานข้อมูล) */
  expectedTotal: number;
  /** true เมื่อ total >= expectedTotal เท่านั้น — ใช้แยกรอบที่ทำจบจากรอบที่ทำค้างไว้กลางคัน */
  complete: boolean;
  at: number;
  /** id ของข้อที่ตอบผิดในรอบล่าสุด — ใช้ให้ผู้เรียนกลับมาดูเฉพาะข้อที่พลาด */
  missed: string[];
}

/** จำนวนข้อของแต่ละบท: slug → จำนวนข้อทั้งหมด (จาก getPracticeIndex()/ProgressLesson.quizCount) */
export type PracticeTotals = Record<string, number>;

export type PracticeMap = Record<string, PracticeResult>;

/** ห่างจากข้อก่อนหน้าเกินนี้ถือว่าเป็นคนละรอบฝึก — attempts ไม่มีคอลัมน์ "รอบ" แยกไว้ต่างหาก */
const ROUND_GAP_MS = 20 * 60 * 1000;

function dedupeById(cloud: AttemptRecord[], local: AttemptRecord[]): AttemptRecord[] {
  const byId = new Map<string, AttemptRecord>();
  for (const r of local) byId.set(r.id, r);
  for (const r of cloud) byId.set(r.id, r); // คลาวด์ยืนยันแล้วว่าส่งสำเร็จ ให้ชนะถ้า id ชนกัน
  return [...byId.values()];
}

/**
 * สรุปผลรอบฝึกล่าสุดของแต่ละบทจาก attempts ดิบ (ตารางเดียวกับที่ P2 สร้างไว้ ไม่มีตารางสรุปแยก)
 *
 * attempts เก็บเป็นรายข้อ ไม่มีคอลัมน์บอกว่าข้อไหนอยู่ "รอบ" เดียวกัน จึงจัดกลุ่มด้วยเวลา:
 * ไล่จากข้อล่าสุดของแต่ละบทย้อนกลับไป ถ้าห่างจากข้อก่อนหน้าเกิน 20 นาทีถือว่าเริ่มรอบใหม่แล้ว
 * (นานกว่าเวลาคิดต่อข้อทั่วไปมากพอที่จะไม่ตัดรอบเดียวกันออกเป็นสองท่อนโดยไม่ตั้งใจ)
 *
 * attempts มีทุกข้อที่ "เคยตอบ" ไม่ว่ารอบนั้นจะทำจบหรือทำค้างไว้กลางคัน — ถ้าถือว่าจำนวนข้อที่พบ
 * คือคะแนนเต็มเสมอ รอบที่ทำค้างไว้ 3 จาก 10 ข้อจะกลายเป็น "3/3 = 100%" ทั้งที่ยังไม่จบ จึงต้องรับ
 * จำนวนข้อจริงของแต่ละบทเข้ามาเทียบ (totals) เพื่อรู้ว่ารอบนั้นจบแล้วหรือยัง
 */
export function computePracticeMap(
  attempts: AttemptRecord[],
  totals: PracticeTotals = {},
): PracticeMap {
  const byLesson = new Map<string, AttemptRecord[]>();
  for (const a of attempts) {
    if (a.examId) continue; // เอาเฉพาะที่มาจากโหมดฝึก ไม่ใช่จากข้อสอบจำลอง
    const list = byLesson.get(a.lessonId) ?? [];
    list.push(a);
    byLesson.set(a.lessonId, list);
  }

  const map: PracticeMap = {};
  for (const [lessonId, list] of byLesson) {
    const sorted = [...list].sort((a, b) => b.createdAt - a.createdAt);
    const round: AttemptRecord[] = [sorted[0]!];
    for (let i = 1; i < sorted.length; i++) {
      if (round[round.length - 1]!.createdAt - sorted[i]!.createdAt > ROUND_GAP_MS) break;
      round.push(sorted[i]!);
    }
    // ไม่รู้จำนวนข้อจริงของบทนี้ (เช่นบทถูกถอดออกจากเนื้อหาไปแล้ว) ให้ถือว่าที่ทำมาคือทั้งหมด
    // แทนที่จะเดาว่า "ทำค้างไว้" ทั้งที่ไม่มีข้อมูลมายืนยัน
    const expectedTotal = totals[lessonId] ?? round.length;
    map[lessonId] = {
      correct: round.filter((a) => a.isCorrect).length,
      total: round.length,
      expectedTotal,
      complete: round.length >= expectedTotal,
      missed: round.filter((a) => !a.isCorrect).map((a) => a.questionId),
      at: round[0]!.createdAt,
    };
  }
  return map;
}

/** ข้อความสั้นแสดงผลรอบล่าสุด — รอบที่ทำค้างไว้ต้องไม่ขึ้นเป็นอัตราส่วนที่ดูเหมือนทำจบแล้ว */
export function formatPracticeResult(r: PracticeResult): string {
  if (!r.complete) return `ทำค้างไว้ ${r.total} จาก ${r.expectedTotal} ข้อ`;
  return `${r.correct}/${r.total}`;
}

/**
 * อ่านผลฝึกล่าสุดต่อบท — แขกอ่านจาก localStorage อย่างเดียว สมาชิกอ่านจากคลาวด์ผสมกับที่ยังค้าง
 * ส่งไม่สำเร็จในเบราว์เซอร์ (แบบเดียวกับ useProgress() ใน store.ts) ไม่มี save() แยกอีกต่อไป เพราะ
 * PracticeRunner บันทึกทุกข้อผ่าน recordAttempt() อยู่แล้วตั้งแต่ P2 — ที่นี่แค่ต้องอ่านใหม่หลังจบ
 * รอบด้วย refresh() เพราะ "ทำใหม่อีกรอบ" ไม่ทำให้คอมโพเนนต์ remount
 */
export function usePracticeResults(totals: PracticeTotals = {}) {
  const { user, mergeVersion } = useSession();
  const userId = user?.id ?? null;
  const [map, setMap] = useState<PracticeMap>({});
  const [ready, setReady] = useState(false);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    (async () => {
      const cloud = userId ? await readCloudAttempts(userId) : [];
      if (cancelled) return;
      setMap(computePracticeMap(dedupeById(cloud, readLocalAttempts()), totals));
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- totals มาจาก getPracticeIndex()/quizCount ของผู้เรียก ค่าคงที่ต่อเนื้อหา ไม่ต้องเฝ้าดูการเปลี่ยนแปลง
  }, [userId, mergeVersion, version]);

  /**
   * ลบผลฝึกทั้งฝั่งเบราว์เซอร์นี้และฝั่งคลาวด์ (ถ้าล็อกอินอยู่) — ต้องลบทั้งคู่พร้อมกันเสมอ
   * เพราะถ้าลบแค่ local แล้วมีคนเอาไปต่อปุ่ม "ลบผลการฝึก" ให้สมาชิกกด ข้อมูลจะเด้งกลับมาจาก
   * คลาวด์ทันทีตอน refresh() โดยดูเหมือนลบสำเร็จแต่จริง ๆ ไม่ได้ลบอะไรเลย
   */
  const reset = useCallback(async () => {
    clearLocalPracticeAttempts();
    if (userId) await deleteCloudPracticeAttempts(userId);
    refresh();
  }, [refresh, userId]);

  return { map, ready, refresh, reset };
}

/** เกณฑ์เดียวที่ใช้ทั้งเว็บ — ต่ำกว่า 70% ถือว่าควรกลับไปทบทวนบทนั้น
 * รอบที่ทำค้างไว้ (ยังไม่จบ) ต้องไม่มีทางคืน false เพราะยังไม่รู้ผลจริง จะปล่อยผ่านไม่ได้ */
export function needsReview(r: PracticeResult): boolean {
  if (!r.complete) return true;
  return r.total > 0 && r.correct / r.total < 0.7;
}
