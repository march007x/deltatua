"use client";

import { useEffect } from "react";
import { useProgress } from "@/lib/progress/store";

export function LessonCompleteButton({ lessonId }: { lessonId: string }) {
  const { map, ready, markOpened, toggleCompleted, saveState } = useProgress();
  const done = map[lessonId]?.status === "completed";

  useEffect(() => {
    markOpened(lessonId);
  }, [lessonId, markOpened]);

  return (
    <>
      <button
        type="button"
        disabled={!ready}
        onClick={() => toggleCompleted(lessonId)}
        className={`min-h-[44px] rounded-pill px-4 py-2 text-[14.5px] font-medium transition duration-[160ms] ease-standard active:scale-[0.97] ${
          done
            ? "border border-ok bg-ok-soft text-ok"
            : "bg-accent text-accent-on hover:bg-accent-press"
        }`}
      >
        {done ? "เรียนจบแล้ว — กดเพื่อยกเลิก" : "ทำเครื่องหมายว่าเรียนจบ"}
      </button>
      {saveState === "error" ? (
        <p className="m-0 mt-2 text-[12.5px] text-danger">
          บันทึกความก้าวหน้าไม่สำเร็จ ตรวจสัญญาณอินเทอร์เน็ตแล้วลองกดใหม่
        </p>
      ) : null}
    </>
  );
}
