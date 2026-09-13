import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * ใช้ service role key — ข้าม RLS ได้ทั้งหมด
 * เรียกได้เฉพาะใน Route Handler ฝั่งเซิร์ฟเวอร์เท่านั้น ห้าม import จากไฟล์ที่รันในเบราว์เซอร์เด็ดขาด
 */
export function createAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
