"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/components/auth/SessionProvider";
import { readCloudAttempts, readLocalAttempts, type AttemptRecord } from "@/lib/events/attempts";
import {
  readCloudSessions,
  readLocalSessions,
  type StudySessionRecord,
} from "@/lib/events/sessions";
import {
  readCloudExamResults,
  readLocalExamResults,
  type ExamResultRecord,
} from "@/lib/events/examResults";
import { readCloud, readLocal, type ProgressMap } from "@/lib/progress/cloud";

export interface AnalyticsData {
  ready: boolean;
  attempts: AttemptRecord[];
  sessions: StudySessionRecord[];
  examResults: ExamResultRecord[];
  lessonProgress: ProgressMap;
}

/** คลาวด์เป็นแหล่งที่ยืนยันว่าส่งสำเร็จแล้ว — ถ้า id ชนกับที่ยังค้างในเบราว์เซอร์ ให้คลาวด์ชนะ */
function dedupeById<T extends { id: string }>(cloud: T[], local: T[]): T[] {
  const byId = new Map<string, T>();
  for (const r of local) byId.set(r.id, r);
  for (const r of cloud) byId.set(r.id, r);
  return [...byId.values()];
}

/**
 * รวมข้อมูลดิบทั้งหมดที่ใช้วาดกราฟพัฒนาการของผู้ใช้ปัจจุบัน
 * แขก (ไม่ล็อกอิน) อ่านจาก localStorage อย่างเดียว · สมาชิกอ่านจากคลาวด์ผสมกับที่ยังค้างในเบราว์เซอร์
 * (ยังส่งไม่สำเร็จ) เพื่อไม่ให้เหตุการณ์ล่าสุดหายไปจากกราฟระหว่างรอ retry
 */
export function useAnalyticsData(): AnalyticsData {
  const { user, mergeVersion } = useSession();
  const userId = user?.id ?? null;
  const [data, setData] = useState<AnalyticsData>({
    ready: false,
    attempts: [],
    sessions: [],
    examResults: [],
    lessonProgress: {},
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      let cloudAttempts: AttemptRecord[] = [];
      let cloudSessions: StudySessionRecord[] = [];
      let cloudExamResults: ExamResultRecord[] = [];
      let lessonProgress: ProgressMap = readLocal();

      if (userId) {
        [cloudAttempts, cloudSessions, cloudExamResults, lessonProgress] = await Promise.all([
          readCloudAttempts(userId),
          readCloudSessions(userId),
          readCloudExamResults(userId),
          readCloud(userId),
        ]);
      }

      if (cancelled) return;
      setData({
        ready: true,
        attempts: dedupeById(cloudAttempts, readLocalAttempts()),
        sessions: dedupeById(cloudSessions, readLocalSessions()),
        examResults: dedupeById(cloudExamResults, readLocalExamResults()),
        lessonProgress,
      });
    })();

    return () => {
      cancelled = true;
    };
    // mergeVersion เปลี่ยนหลังรวมข้อมูลจากเบราว์เซอร์เข้าบัญชีสำเร็จ — ต้องอ่านใหม่เพราะ fetch แรกอาจชิงเกิดก่อนรวมเสร็จ
  }, [userId, mergeVersion]);

  return data;
}
