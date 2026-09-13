import type { ExamSlot } from "@/content/exams";

const DAY_MS = 24 * 60 * 60 * 1000;

/** จำนวนวันที่เหลือ (ปัดเศษขึ้น) นับจาก now ถึง iso — ลบได้ถ้า iso อยู่ในอดีตแล้ว */
export function daysUntil(iso: string, now: number): number {
  return Math.ceil((new Date(iso).getTime() - now) / DAY_MS);
}

/** ตรวจสอบล่าสุดเกิน 60 วันแล้วหรือยัง — ใช้ขึ้นป้าย "ข้อมูลอาจไม่อัปเดต" อัตโนมัติ */
export function isStaleVerification(verifiedAt: string, now: number): boolean {
  const verifiedMs = new Date(`${verifiedAt}T00:00:00+07:00`).getTime();
  return now - verifiedMs > 60 * DAY_MS;
}

export interface CountdownParts {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

/** แตกเวลาที่เหลือเป็นวัน/ชม./นาที/วิ — คำนวณสดทุกครั้งที่เรียก ไม่แคชค่าไว้ */
export function formatCountdown(targetIso: string, now: number): CountdownParts {
  const totalMs = new Date(targetIso).getTime() - now;
  const isPast = totalMs < 0;
  const abs = Math.abs(totalMs);
  return {
    totalMs,
    days: Math.floor(abs / DAY_MS),
    hours: Math.floor((abs % DAY_MS) / (60 * 60 * 1000)),
    minutes: Math.floor((abs % (60 * 60 * 1000)) / (60 * 1000)),
    seconds: Math.floor((abs % (60 * 1000)) / 1000),
    isPast,
  };
}

export interface Deadline {
  exam: ExamSlot;
  kind: "exam" | "registration";
  at: number;
}

/**
 * เหตุการณ์ถัดไปที่ใกล้ที่สุดในบรรดา "ทุกแถว x ทั้งสองชนิดเหตุการณ์" (วันสอบ, วันปิดรับสมัคร)
 * ไม่ใช่แค่ดูวันปิดรับสมัครของแถวที่วันสอบใกล้ที่สุดแถวเดียว — เพราะแถวอื่นอาจปิดรับสมัครเร็วกว่า
 * ก่อนวันสอบของแถวแรกด้วยซ้ำ ต้องไล่เทียบทุกแถวพร้อมกันเสมอ
 */
export function nextDeadline(exams: ExamSlot[], now: number): Deadline | null {
  const events: Deadline[] = [];
  for (const e of exams) {
    if (e.startsOn) events.push({ exam: e, kind: "exam", at: new Date(e.startsOn).getTime() });
    if (e.registrationClosesOn) {
      events.push({ exam: e, kind: "registration", at: new Date(e.registrationClosesOn).getTime() });
    }
  }
  const future = events.filter((ev) => ev.at > now);
  if (future.length === 0) return null;
  future.sort((a, b) => a.at - b.at);
  return future[0]!;
}

/** แบ่งสนามสอบเป็นสองโซน: ที่ยังไม่ถึง (รวมที่ยังไม่ประกาศวัน) กับที่ผ่านไปแล้ว — ไม่ลบโซนหลังทิ้ง */
export function splitUpcomingPast(
  exams: ExamSlot[],
  now: number,
): { upcoming: ExamSlot[]; past: ExamSlot[] } {
  const upcoming: ExamSlot[] = [];
  const past: ExamSlot[] = [];

  for (const e of exams) {
    if (e.startsOn && new Date(e.startsOn).getTime() < now) past.push(e);
    else upcoming.push(e);
  }

  upcoming.sort((a, b) => {
    if (!a.startsOn && !b.startsOn) return a.examGroup.localeCompare(b.examGroup);
    if (!a.startsOn) return 1; // ยังไม่ประกาศวัน ไปท้ายกลุ่ม upcoming
    if (!b.startsOn) return -1;
    return new Date(a.startsOn).getTime() - new Date(b.startsOn).getTime();
  });

  past.sort((a, b) => new Date(b.startsOn!).getTime() - new Date(a.startsOn!).getTime());

  return { upcoming, past };
}
