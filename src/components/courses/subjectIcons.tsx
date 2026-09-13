/**
 * ไอคอนเส้นต่อวิชา (P9 ข้อ 2/12) — แทนภาพถ่ายแนวแฟนตาซี/นีออนเดิม
 * วาดเองเป็น SVG stroke-width 1.8 บนกริด 24×24 ตามสเปกที่ล็อกไว้ ไม่ใช้ไลบรารีไอคอน
 * และไม่ใช้ AI สร้างภาพแทน เพื่อให้แก้สีตามธีมได้ตรง ๆ และคุมโทนให้นิ่งกว่าภาพถ่าย
 */
export type SubjectIconKey = "math" | "physics" | "chemistry" | "biology" | "english";

const SHAPES: Record<SubjectIconKey, React.ReactNode> = {
  // รากที่สอง — สัญลักษณ์คณิตศาสตร์ที่จำได้ทันที ไม่ใช่กราฟลอย ๆ ทั่วไป
  math: <path d="M3.5 13.5 6 17l3-11h11.5" />,
  // อะตอม — วงโคจรสองวงตัดกันรอบนิวเคลียส
  physics: (
    <>
      <ellipse cx={12} cy={12} rx={9} ry={3.4} />
      <ellipse cx={12} cy={12} rx={9} ry={3.4} transform="rotate(60 12 12)" />
      <ellipse cx={12} cy={12} rx={9} ry={3.4} transform="rotate(120 12 12)" />
      <circle cx={12} cy={12} r={1.4} fill="currentColor" stroke="none" />
    </>
  ),
  // ขวดรูปชมพู่ — สัญลักษณ์เคมีที่เห็นแล้วรู้ทันที
  chemistry: <path d="M10 3h4M10.5 3v6.5L5.5 18a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3l-5-8.5V3M7.8 15h8.4" />,
  // ใบไม้พร้อมเส้นกลางใบ — ชีววิทยา
  biology: <path d="M5 19c8-1 12-6 13.5-14.5C10 6 6 11 5 19ZM6 18c2.5-4 5-7 11-11.5" />,
  // ลูกโป่งคำพูดพร้อมเส้นข้อความ — ภาษา ไม่ใช้ไอคอนหนังสือ
  english: <path d="M4 5h16v10.5H9L5 19v-3.5H4ZM7.5 8.5h9M7.5 11.5h6" />,
};

export function SubjectIcon({ subject, size = 22 }: { subject: SubjectIconKey; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {SHAPES[subject]}
    </svg>
  );
}
