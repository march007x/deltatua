import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CURRENT_CONSENT_VERSION } from "@/lib/supabase/config";

/** ปลายทางที่ Supabase ส่งกลับมาหลังผู้ใช้ยืนยันตัวตนกับ Google — แลก code เป็น session */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  const rawNext = searchParams.get("next");
  // ต้องขึ้นต้นด้วย "/" ตัวเดียว (ไม่ใช่ "//" ซึ่งเบราว์เซอร์ตีความเป็น URL เต็มรูปแบบไปโดเมนอื่น) กัน open redirect
  const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/today";

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data.user) {
        // สร้างแถว profiles ถ้ายังไม่มี และบันทึกวันที่ยินยอมแค่ครั้งแรกเท่านั้น
        const { data: existing } = await supabase
          .from("profiles")
          .select("consented_at")
          .eq("id", data.user.id)
          .maybeSingle();

        if (!existing) {
          await supabase.from("profiles").insert({
            id: data.user.id,
            consented_at: new Date().toISOString(),
            consent_version: CURRENT_CONSENT_VERSION,
          });
        } else if (!existing.consented_at) {
          await supabase
            .from("profiles")
            .update({ consented_at: new Date().toISOString() })
            .eq("id", data.user.id);
        }

        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
