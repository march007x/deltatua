"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mergeLocalProgressIntoCloud, writeLocal } from "@/lib/progress/cloud";
import { mergeLocalAttemptsIntoCloud } from "@/lib/events/attempts";
import { mergeLocalSessionsIntoCloud } from "@/lib/events/sessions";
import { mergeLocalExamResultsIntoCloud } from "@/lib/events/examResults";

interface SessionState {
  user: User | null;
  loading: boolean;
  mergedCount: number | null;
  /** เพิ่มค่าทุกครั้งที่รวมข้อมูลจากเบราว์เซอร์เข้าบัญชีสำเร็จ — ให้ useProgress() รู้ว่าต้องอ่านใหม่ */
  mergeVersion: number;
  dismissMerge: () => void;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionState>({
  user: null,
  loading: false,
  mergedCount: null,
  mergeVersion: 0,
  dismissMerge: () => {},
  signOut: async () => {},
});

export function useSession() {
  return useContext(SessionContext);
}

/** ติดตามสถานะล็อกอิน + รวมความก้าวหน้าจากเบราว์เซอร์เข้าบัญชีอัตโนมัติทุกครั้งที่ยังมีข้อมูลแขกค้างอยู่ */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mergedCount, setMergedCount] = useState<number | null>(null);
  const [mergeVersion, setMergeVersion] = useState(0);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }
    let active = true;

    async function syncUser(nextUser: User | null) {
      if (!active) return;
      setUser(nextUser);
      setLoading(false);
      if (!nextUser) return;

      const { merged, allOk } = await mergeLocalProgressIntoCloud(nextUser.id);
      if (!active) return;

      // ล้าง localStorage เฉพาะตอนรวมสำเร็จครบทุกรายการเท่านั้น — ไม่งั้นเบราว์เซอร์เดียวกัน
      // จะส่งต่อความก้าวหน้าของคนก่อนหน้าให้คนถัดไปที่ล็อกอินทีหลัง
      // ไม่ใช้ marker แยกอีกต่อไป: ถ้า allOk เป็น false ข้อมูลยังอยู่ใน localStorage
      // แล้วจะถูกลองรวมใหม่โดยอัตโนมัติในครั้งถัดไปที่ตรวจสถานะล็อกอิน
      if (allOk) writeLocal({});

      // attempts/study_sessions/exam_results เป็น log เหตุการณ์ดิบ ไม่มีสถานะ "ก้าวหน้ากว่า" ให้เทียบ
      // แต่ละอันที่รวมสำเร็จถูกลบออกจาก localStorage ทีละรายการอยู่แล้วในตัวฟังก์ชันเอง
      await Promise.all([
        mergeLocalAttemptsIntoCloud(nextUser.id),
        mergeLocalSessionsIntoCloud(nextUser.id),
        mergeLocalExamResultsIntoCloud(nextUser.id),
      ]);
      if (!active) return;

      if (merged === 0) return;

      setMergedCount(merged);
      // เปลี่ยนค่านี้เพื่อบอก useProgress() ที่ fetch ไปก่อนหน้า (อาจชิงอ่านก่อนรวมข้อมูลเสร็จ) ให้อ่านใหม่
      setMergeVersion((v) => v + 1);
    }

    supabase.auth.getUser().then(({ data }) => syncUser(data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncUser(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  return (
    <SessionContext.Provider
      value={{
        user,
        loading,
        mergedCount,
        mergeVersion,
        dismissMerge: () => setMergedCount(null),
        signOut,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
