"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/components/auth/SessionProvider";
import {
  clearCloud,
  readCloud,
  readLocal,
  writeCloudOne,
  writeLocal,
  type LessonProgress,
  type ProgressMap,
} from "./cloud";

export type { LessonProgress, ProgressMap };

export type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * แขก (ไม่ล็อกอิน) อ่าน/เขียน localStorage ตรง ๆ · สมาชิกอ่าน/เขียน Supabase แทน
 * หน้าเว็บที่เรียก useProgress() ไม่ต้องรู้ว่าตอนนี้ใช้แหล่งไหนอยู่ — สลับให้อัตโนมัติตามสถานะล็อกอิน
 * saveState สะท้อนผลการเขียนจริงเสมอ — ห้ามให้ "saved" ก่อนที่ writeCloudOne จะยืนยันว่าไม่มี error
 */
export function useProgress() {
  const { user, mergeVersion } = useSession();
  const userId = user?.id ?? null;
  const [map, setMap] = useState<ProgressMap>({});
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    (async () => {
      const next = userId ? await readCloud(userId) : readLocal();
      if (!cancelled) {
        setMap(next);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // mergeVersion เปลี่ยนหลังรวมข้อมูลจากเบราว์เซอร์เข้าบัญชีเสร็จ — ต้อง fetch ใหม่เพราะ fetch แรกอาจชิงเกิดก่อนรวมเสร็จ
  }, [userId, mergeVersion]);

  const update = useCallback(
    (lessonId: string, patch: Partial<LessonProgress>) => {
      setMap((prev) => {
        const current: LessonProgress = prev[lessonId] ?? {
          status: "not_started",
          lastOpenedAt: Date.now(),
        };
        const next = { ...prev, [lessonId]: { ...current, ...patch } };
        if (userId) {
          setSaveState("saving");
          writeCloudOne(userId, lessonId, next[lessonId]!).then(({ ok }) => {
            setSaveState(ok ? "saved" : "error");
          });
        } else {
          writeLocal(next);
          setSaveState("saved");
        }
        return next;
      });
    },
    [userId],
  );

  const markOpened = useCallback(
    (lessonId: string) => {
      setMap((prev) => {
        const current = prev[lessonId];
        if (current?.status === "completed") return prev;
        const next: ProgressMap = {
          ...prev,
          [lessonId]: { status: "in_progress", lastOpenedAt: Date.now() },
        };
        if (userId) {
          setSaveState("saving");
          writeCloudOne(userId, lessonId, next[lessonId]!).then(({ ok }) => {
            setSaveState(ok ? "saved" : "error");
          });
        } else {
          writeLocal(next);
          setSaveState("saved");
        }
        return next;
      });
    },
    [userId],
  );

  const toggleCompleted = useCallback(
    (lessonId: string) => {
      const current = map[lessonId];
      const done = current?.status === "completed";
      update(lessonId, {
        status: done ? "in_progress" : "completed",
        completedAt: done ? undefined : Date.now(),
        lastOpenedAt: Date.now(),
      });
    },
    [map, update],
  );

  const reset = useCallback(() => {
    setMap({});
    if (userId) clearCloud(userId);
    else writeLocal({});
  }, [userId]);

  return { map, ready, markOpened, toggleCompleted, reset, saveState };
}
