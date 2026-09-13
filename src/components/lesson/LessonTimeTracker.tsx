"use client";

import { useEffect, useRef } from "react";
import { useSession } from "@/components/auth/SessionProvider";
import { recordStudySession } from "@/lib/events/sessions";
import { useActiveTimer } from "@/lib/events/timer";

/**
 * เก็บเวลาที่อ่านบทนี้จริง (นับเฉพาะเวลาที่มีการกระทำ) แล้วบันทึกเป็น study_sessions
 * บันทึกทุกครั้งที่แท็บถูกซ่อน (สลับแท็บ/ปิดแท็บ/รีเฟรช) ไม่ใช่รอแค่ตอน unmount เพราะปิดแท็บจริง
 * ไม่ trigger React cleanup เสมอไป — ต้องอาศัย visibilitychange/pagehide ซึ่งเบราว์เซอร์รับประกันว่าจะยิง
 */
export function LessonTimeTracker({ lessonId }: { lessonId: string }) {
  const { user } = useSession();
  const timer = useActiveTimer();
  const startedAtRef = useRef(Date.now());
  const userIdRef = useRef(user?.id ?? null);
  userIdRef.current = user?.id ?? null;

  useEffect(() => {
    function flush() {
      const minutes = Math.round(timer.seconds() / 60);
      const startedAt = startedAtRef.current;
      const endedAt = Date.now();
      timer.reset();
      startedAtRef.current = endedAt;
      if (minutes < 1) return;
      void recordStudySession(userIdRef.current, {
        id: crypto.randomUUID(),
        source: "lesson",
        refId: lessonId,
        minutes,
        startedAt,
        endedAt,
      });
    }

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") flush();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [lessonId, timer]);

  return null;
}
