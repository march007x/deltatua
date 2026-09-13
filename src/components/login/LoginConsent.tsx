"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/layout/Icon";
import { cx } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * การ์ดยินยอม + ปุ่มเข้าสู่ระบบด้วย Google
 *
 * ต้องกาช่องยินยอมก่อนปุ่ม Google ถึงจะกดได้ — ขอความยินยอมก่อนเก็บข้อมูลทุกครั้ง ไม่ใช่แค่ครั้งแรก
 * ถ้าเว็บนี้ยังไม่ได้ตั้งค่า Supabase (ไม่มี env) ปุ่มจะบอกตรง ๆ ว่ายังใช้งานไม่ได้ แทนที่จะพังเงียบ ๆ
 */
export function LoginConsent() {
  const [agreed, setAgreed] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setNotConfigured(false);
    setErrorMsg(null);

    if (!isSupabaseConfigured) {
      setNotConfigured(true);
      return;
    }
    const supabase = createClient();
    if (!supabase) {
      setNotConfigured(true);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/progress` },
    });
    if (error) {
      setErrorMsg("เข้าสู่ระบบไม่สำเร็จ ลองใหม่อีกครั้ง");
      setLoading(false);
    }
    // สำเร็จ: เบราว์เซอร์ถูกพาไปหน้า Google ทันที ไม่ต้อง setLoading(false)
  }

  return (
    <div className="w-full max-w-[400px] rounded-2xl border border-hero-line bg-hero-bg/70 p-7 backdrop-blur-xl sm:p-8">
      <p className="m-0 mb-1 font-mono text-[11px] tracking-[0.18em] text-hero-ink-3 uppercase">
        เข้าสู่ระบบ
      </p>
      <h1 className="m-0 mb-5 font-display text-[24px] font-semibold text-hero-ink">
        ยินดีต้อนรับกลับ
      </h1>

      <div className="mb-5 rounded-xl border border-hero-line bg-hero-bg/60 p-4">
        <p className="m-0 mb-2 text-[13px] font-medium text-hero-ink-2">
          ข้อมูลที่จะถูกเก็บถ้าคุณผูกบัญชี
        </p>
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-[12.5px] leading-relaxed text-hero-ink-3">
          <li className="flex gap-2">
            <Icon name="check" size={13} className="mt-0.5 shrink-0 text-lime" />
            อีเมลจากบัญชี Google — ใช้ระบุตัวตนอย่างเดียว
          </li>
          <li className="flex gap-2">
            <Icon name="check" size={13} className="mt-0.5 shrink-0 text-lime" />
            ความก้าวหน้าการเรียน — บทที่เรียนจบ คะแนนฝึกหัด
          </li>
          <li className="flex gap-2">
            <Icon name="check" size={13} className="mt-0.5 shrink-0 text-hero-ink-3" />
            ไม่เก็บรหัสผ่านของคุณเอง — ยืนยันตัวตนผ่าน Google โดยตรง
          </li>
        </ul>
        <Link
          href="/privacy"
          className="mt-3 inline-block text-[12px] text-hero-ink-2 underline underline-offset-2 hover:text-hero-ink"
        >
          อ่านนโยบายความเป็นส่วนตัวฉบับเต็ม
        </Link>
      </div>

      <label className="mb-4 flex cursor-pointer items-start gap-2.5 text-[12.5px] leading-relaxed text-hero-ink-2">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => {
            setAgreed(e.target.checked);
            setNotConfigured(false);
            setErrorMsg(null);
          }}
          className="mt-0.5 h-4 w-4 shrink-0"
          style={{ accentColor: "var(--accent)" }}
        />
        ฉันอ่านและยินยอมให้เก็บข้อมูลตามที่ระบุไว้ด้านบน
      </label>

      <button
        type="button"
        disabled={!agreed || loading}
        onClick={handleGoogleSignIn}
        className={cx(
          "flex w-full items-center justify-center gap-2.5 rounded-lg border px-4 py-3 text-[14.5px] font-medium transition-colors",
          agreed && !loading
            ? "border-hero-cta bg-hero-cta text-hero-cta-ink hover:opacity-90"
            : "cursor-not-allowed border-hero-line text-hero-ink-3",
        )}
      >
        <GoogleG />
        {loading ? "กำลังพาไปหน้า Google…" : "ดำเนินการต่อด้วย Google"}
      </button>

      {notConfigured ? (
        <p className="m-0 mt-3 rounded-lg border border-warn/40 bg-hero-bg/60 px-3 py-2.5 text-[12px] leading-relaxed text-hero-ink-2">
          เว็บนี้ยังไม่ได้ตั้งค่าระบบบัญชี (Supabase) จึงเข้าสู่ระบบไม่ได้ในตอนนี้
        </p>
      ) : null}
      {errorMsg ? (
        <p className="m-0 mt-3 rounded-lg border border-danger/40 bg-hero-bg/60 px-3 py-2.5 text-[12px] leading-relaxed text-hero-ink-2">
          {errorMsg}
        </p>
      ) : null}

      <div className="mt-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-hero-line" />
        <span className="font-mono text-[10.5px] tracking-wide text-hero-ink-3">หรือ</span>
        <span className="h-px flex-1 bg-hero-line" />
      </div>

      <Link
        href="/courses"
        className="mt-5 block text-center text-[13.5px] text-hero-ink-2 underline underline-offset-2 hover:text-hero-ink"
      >
        เรียนต่อแบบไม่ผูกบัญชี
      </Link>
      <p className="m-0 mt-2 text-center text-[11.5px] leading-relaxed text-hero-ink-3">
        เรียนได้ทันที แต่ความก้าวหน้าจะอยู่ในเบราว์เซอร์นี้เท่านั้น
      </p>
    </div>
  );
}

/** โลโก้ G สี่สีของ Google — ข้อยกเว้นเดียวที่ใช้ hex ตรง ๆ เพราะเป็นสีตราสัญลักษณ์ภายนอก
 *  ตามแนวทางปุ่ม "Sign in with Google" ของ Google เอง ไม่ใช่สีในชุดดีไซน์ของเว็บนี้ */
function GoogleG() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden focusable="false">
      <path
        fill="#4285F4"
        d="M45.1 24.5c0-1.6-.15-3.2-.4-4.7H24v9h11.8c-.5 2.7-2 5-4.3 6.6v5.4h6.9c4-3.7 6.3-9.2 6.3-16.3z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.8 0 10.7-1.9 14.3-5.2l-6.9-5.4c-1.9 1.3-4.4 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.7v5.6C8.3 41.1 15.6 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.8 28.5c-.4-1.3-.7-2.6-.7-4s.2-2.7.7-4v-5.6H4.7C3.2 17.9 2.4 20.9 2.4 24s.8 6.1 2.3 9z"
      />
      <path
        fill="#EA4335"
        d="M24 10.3c3.2 0 6 1.1 8.2 3.2l6.1-6.1C34.7 3.9 29.8 2 24 2 15.6 2 8.3 6.9 4.7 14.4l7.1 5.6c1.7-5.2 6.5-9 12.2-9z"
      />
    </svg>
  );
}
