"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/layout/Icon";
import { useSession } from "./SessionProvider";

/** ปุ่มสถานะล็อกอินบนหัวจอ — ยังไม่ล็อกอินแสดงลิงก์เข้าสู่ระบบ ล็อกอินแล้วเป็นเมนูบัญชี/ออกจากระบบ */
export function AuthStatus() {
  const { user, loading, signOut } = useSession();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (loading) {
    return <span aria-hidden className="h-9 w-9 shrink-0 rounded-lg border border-line bg-surface" />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-[13.5px] font-medium text-ink-2 no-underline hover:border-line-strong hover:text-ink lg:px-3"
      >
        <Icon name="user" size={15} />
        <span className="hidden lg:inline">เข้าสู่ระบบ</span>
      </Link>
    );
  }

  const initial = (user.email ?? "?").charAt(0).toUpperCase();

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="บัญชีของฉัน"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-surface text-[13.5px] font-medium text-ink-2 hover:border-line-strong hover:text-ink"
      >
        {initial}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute top-full right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-surface p-1.5"
        >
          <p className="m-0 truncate px-3 py-2 text-[12.5px] text-ink-3">{user.email}</p>
          <Link
            href="/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] text-ink-2 no-underline hover:bg-surface-2 hover:text-ink"
          >
            <Icon name="user" size={15} />
            บัญชีของฉัน
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              setOpen(false);
              await signOut();
              router.push("/");
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[14px] text-ink-2 hover:bg-surface-2 hover:text-ink"
          >
            <Icon name="logout" size={15} />
            ออกจากระบบ
          </button>
        </div>
      ) : null}
    </div>
  );
}
