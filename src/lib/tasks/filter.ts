import type { TaskKind } from "./data";

/** วิชาที่พบบ่อย ใช้เป็นค่าตั้งต้นใน datalist — ไม่ใช่รายการปิด ผู้ใช้พิมพ์วิชาอื่นได้เสมอ */
export const COMMON_SUBJECTS = [
  "คณิตศาสตร์",
  "ฟิสิกส์",
  "เคมี",
  "ชีววิทยา",
  "ภาษาไทย",
  "ภาษาอังกฤษ",
  "สังคมศึกษา",
  "ประวัติศาสตร์",
];

interface Taskish {
  taskKind?: TaskKind;
  subject?: string;
}

/** กรองตามชนิดงาน — งานที่ไม่มีชนิด (เช่นงานที่ระบบสร้างจากแผน) จะหลุดออกเสมอเมื่อกรองด้วยชนิดใดชนิดหนึ่ง */
export function filterByKind<T extends Taskish>(tasks: T[], kind: TaskKind | "all"): T[] {
  if (kind === "all") return tasks;
  return tasks.filter((t) => t.taskKind === kind);
}

/** กรองตามวิชา — เทียบตรงตัวกับข้อความที่ผู้ใช้พิมพ์ไว้ */
export function filterBySubject<T extends Taskish>(tasks: T[], subject: string | "all"): T[] {
  if (subject === "all") return tasks;
  return tasks.filter((t) => t.subject === subject);
}

/** รวมวิชาที่พบบ่อยกับวิชาที่ผู้ใช้เคยพิมพ์เอง ตัดซ้ำและเรียงตามตัวอักษรไทย — ใช้เป็น datalist ของฟอร์ม */
export function collectSubjects(usedSubjects: Array<string | undefined>): string[] {
  const set = new Set(COMMON_SUBJECTS);
  for (const s of usedSubjects) {
    const trimmed = s?.trim();
    if (trimmed) set.add(trimmed);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "th"));
}

/** วิชาที่ปรากฏจริงในลิสต์ที่ให้มา — ใช้กับตัวกรองบนหน้ารายการ (ต่างจาก collectSubjects ที่ใช้กับ
 * ฟอร์ม เพราะตัวกรองไม่ควรมีตัวเลือกที่ตอนนี้ไม่มีงานตรงเงื่อนไขเลย) */
export function subjectsInList<T extends Taskish>(tasks: T[]): string[] {
  const set = new Set<string>();
  for (const t of tasks) {
    if (t.subject) set.add(t.subject);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "th"));
}
