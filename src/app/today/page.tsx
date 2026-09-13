import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildProgressIndex } from "@/lib/repo/progress-index";
import { TodayPageClient } from "@/components/planner/TodayPageClient";

export const metadata: Metadata = {
  title: "วันนี้",
  description: "รายการของวันนี้ตามแผนอ่าน พร้อมสถานะเทียบกับแผนจริง",
};

export default async function TodayPage() {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-12">
        <h1 className="m-0 mb-3 font-display text-[26px] font-bold text-ink">วันนี้</h1>
        <p className="m-0 text-[15px] text-ink-2">
          ระบบบัญชียังไม่เปิดใช้งานบนเว็บนี้ตอนนี้ — ฟีเจอร์นี้ต้องมีบัญชีจึงใช้ได้
        </p>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const lessons = buildProgressIndex();
  return <TodayPageClient lessons={lessons} />;
}
