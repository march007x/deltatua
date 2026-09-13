/** true เมื่อมี env ครบพอให้ต่อ Supabase ได้ — ใช้เช็คก่อนแสดง UI ที่ต้องล็อกอินเสมอ */
export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

/** เวอร์ชันข้อตกลงยินยอมล่าสุด — ที่เดียวที่กำหนดค่านี้ เปลี่ยนเมื่อแก้เนื้อหาที่ขอความยินยอม (เช่นหน้า /privacy) อย่างมีนัยสำคัญ */
export const CURRENT_CONSENT_VERSION = "2026-09-12";
