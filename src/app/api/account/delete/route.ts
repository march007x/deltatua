import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** ลบบัญชี auth.users ของผู้ใช้ที่ล็อกอินอยู่ — profiles/lesson_progress ลบตามด้วย cascade */
export async function POST() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "ระบบบัญชียังไม่เปิดใช้งาน" }, { status: 501 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "ยังไม่ได้เข้าสู่ระบบ" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "ยังไม่เปิดใช้งานการลบบัญชีบนเซิร์ฟเวอร์นี้ — ต้องตั้งค่า SUPABASE_SERVICE_ROLE_KEY ก่อน" },
      { status: 501 },
    );
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: "ลบบัญชีไม่สำเร็จ ลองใหม่อีกครั้ง" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
