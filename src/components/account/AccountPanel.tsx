"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/layout/Icon";

export function AccountPanel({
  email,
  consentedAt,
}: {
  email: string;
  consentedAt: string | null;
}) {
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setDownloading(true);
    setError(null);
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("ระบบบัญชียังไม่เปิดใช้งาน");
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("ไม่พบผู้ใช้");

      const [{ data: profile }, { data: progress }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("lesson_progress").select("*").eq("user_id", user.id),
      ]);

      const payload = {
        exportedAt: new Date().toISOString(),
        account: { id: user.id, email: user.email },
        profile,
        lessonProgress: progress ?? [],
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `delta-data-${user.id}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("ดาวน์โหลดไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setDownloading(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "ลบบัญชีไม่สำเร็จ");

      const supabase = createClient();
      await supabase?.auth.signOut();
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "ลบบัญชีไม่สำเร็จ");
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="m-0 mb-6 font-display text-[clamp(24px,4vw,32px)] font-bold text-ink">
        บัญชีของฉัน
      </h1>

      <div className="mb-6 rounded-lg border border-line bg-surface p-5">
        <dl className="m-0 flex flex-col gap-3">
          <div>
            <dt className="m-0 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-3">
              อีเมล
            </dt>
            <dd className="m-0 mt-0.5 text-[15px] text-ink">{email}</dd>
          </div>
          <div>
            <dt className="m-0 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-3">
              วันที่ยินยอมเก็บข้อมูล
            </dt>
            <dd className="m-0 mt-0.5 text-[15px] text-ink">
              {consentedAt
                ? new Intl.DateTimeFormat("th-TH", {
                    dateStyle: "long",
                    timeStyle: "short",
                    timeZone: "Asia/Bangkok",
                  }).format(new Date(consentedAt))
                : "ไม่มีข้อมูล"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mb-6 rounded-lg border border-line bg-surface p-5">
        <p className="m-0 mb-1 font-display text-[15px] font-semibold text-ink">
          ดาวน์โหลดข้อมูลของฉัน
        </p>
        <p className="m-0 mb-3 text-[13.5px] leading-relaxed text-ink-2">
          ไฟล์ JSON ที่มีโปรไฟล์และความก้าวหน้ารายบททั้งหมดที่ผูกกับบัญชีนี้
        </p>
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 rounded-lg border border-line-strong bg-surface px-4 py-2 text-[14px] font-medium text-ink hover:bg-surface-2 disabled:opacity-60"
        >
          <Icon name="download" size={15} />
          {downloading ? "กำลังเตรียมไฟล์…" : "ดาวน์โหลดเป็น JSON"}
        </button>
      </div>

      <div className="rounded-lg border border-danger bg-danger-soft p-5">
        <p className="m-0 mb-1 font-display text-[15px] font-semibold text-ink">ลบบัญชี</p>
        <p className="m-0 mb-3 text-[13.5px] leading-relaxed text-ink-2">
          ลบบัญชีและข้อมูลทั้งหมด (โปรไฟล์ + ความก้าวหน้ารายบท) ออกจากระบบถาวร กู้คืนไม่ได้
        </p>

        {!confirmingDelete ? (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="flex items-center gap-2 rounded-lg border border-danger px-4 py-2 text-[14px] font-medium text-danger hover:bg-danger/10"
          >
            <Icon name="trash" size={15} />
            ลบบัญชี
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="m-0 text-[13.5px] font-medium text-ink">
              ยืนยันอีกครั้ง — การกดปุ่มด้านล่างจะลบบัญชีนี้ทันทีและกู้คืนไม่ได้
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-danger px-4 py-2 text-[14px] font-medium text-danger-on hover:opacity-90 disabled:opacity-60"
              >
                {deleting ? "กำลังลบ…" : "ยืนยันลบบัญชีถาวร"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
                className="rounded-lg border border-line-strong px-4 py-2 text-[14px] text-ink-2 hover:text-ink"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        )}

        {error ? <p className="m-0 mt-3 text-[13px] text-danger">{error}</p> : null}
      </div>
    </div>
  );
}
