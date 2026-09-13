/**
 * รายชื่อ "componentKey" ของภาพประกอบโต้ตอบทั้งหมดที่มีจริงในระบบ — แยกออกมาจาก registry.tsx
 * (ซึ่งมี "use client" และ import คอมโพเนนต์จริงทั้งหมด) เพื่อให้ฝั่งเซิร์ฟเวอร์ (เช่นหน้าแรก
 * ที่นับจำนวนกราฟโต้ตอบไปแสดงใน STATS) import แค่รายชื่อได้ โดยไม่ลากคอมโพเนนต์ทั้งหมด
 * เข้าไปใน client bundle ของหน้านั้นโดยไม่จำเป็น
 */
export const VIZ_KEYS = [
  "quadratic",
  "graph.linear",
  "graph.vertexForm",
  "graph.absolute",
  "graph.reciprocal",
  "graph.exponential",
  "graph.logarithm",
  "graph.cubicRoots",
  "graph.sine",
  "derivative",
  "unitCircle",
  "venn",
  "numberLine",
  "truthTable",
  "analyticGeometry",
  "sequence",
  "probability",
  "vector",
  "complexPlane",
  "statistics",
  "limit",
  "integral",
  "extrema",
  "matrix",
  "triangle",
] as const;

export type VizKey = (typeof VIZ_KEYS)[number];
