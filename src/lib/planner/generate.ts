export interface PendingLesson {
  slug: string;
  title: string;
  estimatedMinutes: number;
}

export type WeekdayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";
export type MinutesPerDay = Record<WeekdayKey, number>;

export interface PlanItemDraft {
  date: string; // YYYY-MM-DD
  kind: "lesson";
  refId: string;
  title: string;
  minutesPlanned: number;
  sortOrder: number;
}

export interface GeneratedPlan {
  items: PlanItemDraft[];
  /** นาทีของบทที่ยังไม่มีที่ลง เพราะเวลาว่างรวมก่อนวันสอบไม่พอ — 0 แปลว่าจัดลงได้หมด */
  shortfallMinutes: number;
}

export const WEEKDAY_KEYS: WeekdayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export const DAY_MS = 24 * 60 * 60 * 1000;

/** แยก "YYYY-MM-DD" เป็นเวลาเที่ยงคืน UTC ตรง ๆ — ไม่ผ่าน new Date(string) ที่ตีความต่างกันไปตามรูปแบบสตริง */
export function parseIsoDate(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y!, m! - 1, d!);
}

/** แปลงเวลากลับเป็น "YYYY-MM-DD" โดยอ่านด้วย getUTC* เสมอ กันวันเพี้ยนจากการปนกับเวลาท้องถิ่นเครื่อง */
export function formatIsoDate(ms: number): string {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * สร้างแผนการอ่านแบบกำหนดตายตัว (deterministic, บริสุทธิ์) — ไม่อ่านเวลาจริงตอนรัน จึงทดสอบซ้ำได้เสมอ
 *
 * รับ pendingLessons ตามลำดับที่ผู้เรียกจัดมาแล้ว (ต้องเรียงตามพื้นฐานที่ต้องรู้ก่อนมาก่อนเสมอ)
 * ฟังก์ชันนี้ไม่จัดเรียงเอง มีหน้าที่แค่ "หยอด" บทตามลำดับเดิมลงวันว่างเท่านั้น
 *
 * กติกาการจัดวันต่อวัน: ใส่บทถัดไปได้เรื่อย ๆ ตราบใดที่ยังไม่เกินเวลาว่างของวันนั้น
 * ถ้าใส่ไม่ได้เพราะเกินและวันนั้นมีบทอื่นอยู่แล้ว ให้เก็บไปวันถัดไป
 * ถ้าใส่ไม่ได้แต่วันนั้นยังว่างเปล่า (บทเดียวก็ยาวกว่าทั้งวันว่างของวันนั้นแล้ว) ให้ใส่บทนั้นไปเดี่ยว ๆ
 * ในวันนั้นแทนที่จะข้ามบทไปเรื่อย ๆ จนไม่มีที่ลงเลย (ยอมให้วันนั้นเกินเวลาว่างเล็กน้อยดีกว่าไม่จัดให้เลย)
 */
export function generatePlan(
  startDate: string,
  examDate: string,
  minutesPerDay: MinutesPerDay,
  pendingLessons: PendingLesson[],
): GeneratedPlan {
  const startMs = parseIsoDate(startDate);
  const examMs = parseIsoDate(examDate);

  const items: PlanItemDraft[] = [];
  let sortOrder = 0;
  let lessonIndex = 0;

  // t < examMs (ไม่ใช่ <=) คือเว้นวันสอบเองไว้ ไม่วางบทเรียนลงในวันสอบ
  for (let t = startMs; t < examMs && lessonIndex < pendingLessons.length; t += DAY_MS) {
    const weekday = WEEKDAY_KEYS[new Date(t).getUTCDay()]!;
    const budget = minutesPerDay[weekday] ?? 0;
    const date = formatIsoDate(t);
    let usedToday = 0;

    while (lessonIndex < pendingLessons.length) {
      const lesson = pendingLessons[lessonIndex]!;
      const fits = usedToday + lesson.estimatedMinutes <= budget;
      const dayIsEmpty = usedToday === 0;

      if (!fits && !dayIsEmpty) break; // เต็มแล้ว เก็บบทนี้ไว้วันถัดไป
      if (!fits && dayIsEmpty && budget === 0) break; // วันนี้ไม่ว่างเลยทั้งวัน ข้ามไปวันถัดไป

      items.push({
        date,
        kind: "lesson",
        refId: lesson.slug,
        title: lesson.title,
        minutesPlanned: lesson.estimatedMinutes,
        sortOrder: sortOrder++,
      });
      usedToday += lesson.estimatedMinutes;
      lessonIndex++;
    }
  }

  const shortfallMinutes = pendingLessons
    .slice(lessonIndex)
    .reduce((sum, l) => sum + l.estimatedMinutes, 0);

  return { items, shortfallMinutes };
}
