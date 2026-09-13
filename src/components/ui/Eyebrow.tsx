/**
 * ป้ายหัวข้อสั้นเหนือหัวเรื่องหลัก (P9 ข้อ 4) — เดิมแต่ละหน้าเขียน
 * font-mono ตัวพิมพ์ใหญ่เว้นระยะเองซ้ำกันกว่าสิบจุด อ่านเหมือน HUD เกม
 * เปลี่ยนเป็นฟอนต์เนื้อหาปกติ ตัวพิมพ์ปกติ ตามสเกลป้าย (12.5px/500) ในข้อ 12
 *
 * ไม่มี className prop โดยตั้งใจ — ทุกจุดควรหน้าตาเหมือนกันเป๊ะ การรับ className มาทับจะเสี่ยงชนกับ
 * คลาส margin/สีที่ประกาศไว้แล้วโดยไม่รู้ว่าฝั่งไหนชนะ (ลำดับใน CSS ที่ Tailwind สร้าง ไม่ใช่ลำดับใน className string)
 */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="m-0 mb-2 text-[12.5px] font-medium text-accent-ink">{children}</p>;
}
