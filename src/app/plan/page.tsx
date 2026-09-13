import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCourses } from "@/lib/repo/content";
import { buildProgressIndex } from "@/lib/repo/progress-index";
import { PlanPageClient } from "@/components/planner/PlanPageClient";

export const metadata: Metadata = {
  title: "วางแผนอ่านหนังสือ",
  description: "ตอบ 3 คำถาม ระบบจัดตารางอ่านให้ทั้งหมดจากบทที่ยังไม่ผ่านจริง",
};

export default async function PlanPage() {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-12">
        <h1 className="m-0 mb-3 font-display text-[26px] font-bold text-ink">วางแผนอ่านหนังสือ</h1>
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

  const courses = getCourses();
  const lessons = buildProgressIndex();

  return <PlanPageClient courses={courses} lessons={lessons} />;
}
