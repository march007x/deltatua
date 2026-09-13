"use client";

import { useEffect, useState } from "react";

const IDLE_CUTOFF_MS = 5 * 60 * 1000;
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "scroll", "touchstart"] as const;

/**
 * นับเฉพาะเวลาที่ผู้เรียนทำอะไรจริง ๆ — ถ้าไม่มีการกระทำเกิน 5 นาที หรือแท็บถูกซ่อนอยู่
 * ช่วงนั้นจะไม่ถูกนับ กันไม่ให้เปิดแท็บค้างไว้แล้วได้เวลาเรียนฟรี
 */
export class ActiveTimer {
  private activeMs = 0;
  private lastTick: number | null = null;
  private lastActivity = Date.now();
  private hidden = typeof document !== "undefined" && document.visibilityState === "hidden";

  // อ่าน this.hidden ที่เก็บสถานะไว้เอง ไม่อ่าน document.visibilityState สด ๆ ตรงนี้
  // เพราะตอน visibilitychange ยิง event ค่า visibilityState เปลี่ยนไปแล้วก่อนโค้ดจะรันเสมอ
  // ถ้าอ่านสด ๆ ตอนกลับมาจากซ่อนแท็บ จะเห็นค่าเป็น "visible" ทันที ทำให้ช่วงที่ซ่อนแท็บ
  // ทั้งช่วงถูกนับเป็น active ไปด้วย ต้องแยกเป็นค่า flag ที่ตั้งทีหลัง tick() ปิดช่วงเดิมแล้วเท่านั้น
  private tick(now: number) {
    if (this.lastTick !== null) {
      const idle = now - this.lastActivity > IDLE_CUTOFF_MS;
      if (!idle && !this.hidden) this.activeMs += now - this.lastTick;
    }
    this.lastTick = now;
  }

  markActive() {
    const now = Date.now();
    this.tick(now);
    this.lastActivity = now;
  }

  /** ปิดช่วงเวลาเดิมด้วยค่า hidden เก่าก่อน แล้วค่อยสลับสถานะ — เรียกจาก visibilitychange เท่านั้น */
  setHidden(hidden: boolean) {
    this.tick(Date.now());
    this.hidden = hidden;
  }

  seconds(): number {
    this.tick(Date.now());
    return Math.round(this.activeMs / 1000);
  }

  /** เคลียร์เวลาที่นับไว้ — ใช้หลังบันทึกช่วงหนึ่งไปแล้ว เพื่อไม่ให้ช่วงถัดไปนับซ้ำ */
  reset() {
    this.activeMs = 0;
    this.lastTick = Date.now();
    this.lastActivity = Date.now();
  }
}

/** ผูก ActiveTimer เข้ากับกิจกรรมของผู้ใช้ทั้งหน้า — คืนฟังก์ชันเลิกผูกไว้ใช้ตอน unmount */
export function attachActivity(timer: ActiveTimer): () => void {
  const onActivity = () => timer.markActive();
  const onVisibility = () => timer.setHidden(document.visibilityState === "hidden");
  for (const ev of ACTIVITY_EVENTS) window.addEventListener(ev, onActivity, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);
  return () => {
    for (const ev of ACTIVITY_EVENTS) window.removeEventListener(ev, onActivity);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}

/** สร้าง ActiveTimer หนึ่งตัวต่ออายุของ component นี้ ผูกกิจกรรมของผู้ใช้ให้อัตโนมัติ */
export function useActiveTimer(): ActiveTimer {
  const [timer] = useState(() => new ActiveTimer());
  useEffect(() => attachActivity(timer), [timer]);
  return timer;
}
