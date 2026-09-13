"use client";

import { useEffect, useRef, useState } from "react";
import { SITE } from "@/lib/site";

/**
 * ภาพภูเขาที่ปรากฏเมื่อเลื่อนลงมาจากหน้าจอแรก — คั่นก่อน section #about
 *
 * สถานะเริ่มต้น (ก่อน observer ทำงาน หรือถ้า JS ไม่ทำงานเลย) ต้อง "มองเห็นได้เต็ม" อยู่แล้ว
 * เสมอ — ภาพแค่ซูมเข้านิดหน่อย (scale 1.08) กับม่านเข้มกว่าปกติเท่านั้น ไม่ใช่ opacity: 0
 * ที่รอ JS มาเปิดให้ ถ้า reduced-motion เปิดอยู่ ให้ข้ามอนิเมชันไปเลย แสดงภาพนิ่งขั้นสุดท้ายตรง ๆ
 */
export function MountainReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [skipAnimation, setSkipAnimation] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setSkipAnimation(true);
      setRevealed(true);
      return;
    }

    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry!.isIntersecting) {
          setRevealed(true);
          observer.disconnect(); // เล่นครั้งเดียวพอ ไม่ต้องสลับไปมาเวลาเลื่อนขึ้นลงซ้ำ
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="relative h-[70vh] min-h-[380px] overflow-hidden">
      <img
        src="/hero-1600.webp"
        srcSet="/hero-900.webp 900w, /hero-1600.webp 1600w, /hero-2400.webp 2400w"
        sizes="100vw"
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        className={
          "absolute inset-0 h-full w-full select-none object-cover object-center" +
          (skipAnimation ? "" : " transition-transform duration-700 ease-out") +
          (revealed ? " scale-100" : " scale-[1.08]")
        }
      />
      <span
        aria-hidden
        className={
          "pointer-events-none absolute inset-0 bg-gradient-to-t from-hero-bg via-hero-bg/40 to-hero-bg/70" +
          (skipAnimation ? "" : " transition-opacity duration-700 ease-out") +
          (revealed ? " opacity-70" : " opacity-90")
        }
      />
      <div className="relative mx-auto flex h-full max-w-3xl items-center px-6 sm:px-8">
        <p className="m-0 text-[clamp(17px,2.6vw,22px)] leading-relaxed font-medium text-hero-ink text-balance">
          {SITE.meaning}
        </p>
      </div>
    </section>
  );
}
