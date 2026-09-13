import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "./config";

let client: SupabaseClient | null = null;

/** คืนค่า null เมื่อยังไม่ได้ตั้งค่า Supabase (ไม่มี env) — เว็บยังรันต่อได้ในโหมดแขก */
export function createClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return client;
}
