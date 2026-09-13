import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountPanel } from "@/components/account/AccountPanel";

export const metadata: Metadata = {
  title: "บัญชีของฉัน",
  description: "ข้อมูลบัญชี ดาวน์โหลดข้อมูลของตัวเอง หรือลบบัญชี",
};

export default async function AccountPage() {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-12">
        <h1 className="m-0 mb-3 font-display text-[26px] font-bold text-ink">บัญชีของฉัน</h1>
        <p className="m-0 text-[15px] text-ink-2">ระบบบัญชียังไม่เปิดใช้งานบนเว็บนี้ตอนนี้</p>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("consented_at")
    .eq("id", user.id)
    .maybeSingle();

  return <AccountPanel email={user.email ?? "—"} consentedAt={profile?.consented_at ?? null} />;
}
