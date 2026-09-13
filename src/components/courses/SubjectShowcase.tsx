"use client";

import { useRef, useState } from "react";
import { cx } from "@/lib/utils";
import { Icon } from "@/components/layout/Icon";
import { Button, LinkButton } from "@/components/ui/Button";
import { SubjectIcon, type SubjectIconKey } from "./subjectIcons";
import { useLanguage } from "@/components/layout/LanguageContext";

export interface MathMeta {
  lessons: number;
  hours: number;
  levels: string;
}

interface Subject {
  key: SubjectIconKey;
  title: string;
  tagline: string;
  ready: boolean;
}

/**
 * ชั้นวางการ์ดวิชาแบบ 3 มิติ — การ์ดกลางหันตรง การ์ดข้างเอียงหนีเข้าไปในจอ
 *
 * ทำด้วย transform ล้วน (translateX + rotateY + scale) บนพื้นที่ที่ตั้ง perspective ไว้
 * ไม่ใช้ไลบรารี carousel เพราะทั้งหมดที่ต้องการคือย้ายค่า active ตัวเดียว
 * การ์ดวนรอบได้ (offset คำนวณแบบวงกลม) เลื่อนต่อจากใบสุดท้ายแล้วกลับมาใบแรกเอง
 *
 * ตัวเลขบนการ์ดคณิตศาสตร์เป็นค่าจริงที่นับจากไฟล์เนื้อหาตอน build (ส่งมาทาง props)
 * วิชาที่ยังไม่มีเนื้อหาจะไม่มีตัวเลขใด ๆ ทั้งสิ้น — ไม่ใส่จำนวนบทหลอกไว้ให้ดูเต็ม
 */
const SUBJECTS: Subject[] = [
  { key: "math", title: "คณิตศาสตร์", tagline: "วางพื้นฐานให้แน่น แล้วคิดให้ลึกกว่าเดิม", ready: true },
  { key: "physics", title: "ฟิสิกส์", tagline: "เข้าใจจักรวาล ตั้งแต่อนุภาคเล็กที่สุดถึงกาแล็กซี", ready: false },
  { key: "chemistry", title: "เคมี", tagline: "อ่านโลกจากสิ่งที่เล็กเกินกว่าตาจะมองเห็น", ready: false },
  { key: "biology", title: "ชีววิทยา", tagline: "ถอดกลไกเบื้องหลังสิ่งมีชีวิตทั้งหมด", ready: false },
  { key: "english", title: "ภาษาอังกฤษ", tagline: "ภาษาที่ดีขึ้น เปิดโอกาสที่กว้างขึ้น", ready: false },
];

const N = SUBJECTS.length;

/** ระยะจากใบที่เลือกอยู่ แบบวงกลม: -2 -1 0 1 2 */
function offsetOf(index: number, active: number): number {
  let d = index - active;
  if (d > N / 2) d -= N;
  if (d < -N / 2) d += N;
  return d;
}

export function SubjectShowcase({ mathMeta }: { mathMeta: MathMeta }) {
  const [active, setActive] = useState(0);
  const touchX = useRef<number | null>(null);
  const { language } = useLanguage();
  const en = language === "en";

  const go = (step: number) => setActive((i) => (i + step + N) % N);

  return (
    <section
      aria-label={en ? "Choose a subject" : "เลือกวิชา"}
      className="relative px-4 pb-10 sm:px-6 lg:px-10"
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          go(-1);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          go(1);
        }
      }}
    >
      <div
        className="relative mx-auto flex h-[398px] w-full max-w-5xl items-center justify-center sm:h-[500px]"
        style={{ perspective: "1500px" }}
        onTouchStart={(e) => {
          touchX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const start = touchX.current;
          const end = e.changedTouches[0]?.clientX;
          touchX.current = null;
          if (start === null || end === undefined) return;
          const dx = end - start;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        }}
      >
        {SUBJECTS.map((s, i) => {
          const d = offsetOf(i, active);
          const far = Math.abs(d);
          const center = far === 0;

          return (
            <article
              key={s.key}
              aria-hidden={far > 1 ? true : undefined}
              className={cx(
                "absolute w-[min(70vw,272px)] overflow-hidden rounded-card border transition-all duration-500 ease-out select-none sm:w-[348px]",
                "motion-reduce:transition-none",
                center ? "border-transparent shadow-sh-3" : "border-transparent shadow-sh-2",
              )}
              style={{
                aspectRatio: "3 / 4",
                background: "linear-gradient(160deg, var(--art-bg-1) 0%, var(--art-bg-2) 100%)",
                transform: `translateX(${d === 0 ? 0 : far === 1 ? d * 58 : d * 96}%) scale(${
                  center ? 1 : far === 1 ? 0.86 : 0.72
                })`,
                opacity: center ? 1 : far === 1 ? 0.85 : 0.45,
                zIndex: 30 - far * 10,
                pointerEvents: far > 2 ? "none" : undefined,
              }}
            >
              {/* ป้ายสถานะมุมบน — บอกตั้งแต่แวบแรกว่าใบไหนเรียนได้จริง */}
              <p className="absolute top-3.5 left-4 m-0 flex items-center gap-1.5 text-[11.5px] font-medium text-white/70">
                <span
                  aria-hidden
                  className={cx(
                    "inline-block h-1.5 w-1.5 rounded-full",
                    s.ready ? "bg-lime" : "bg-white/40",
                  )}
                />
                {s.ready ? (en ? "Now available" : "เปิดเรียนแล้ว") : (en ? "Coming soon" : "เร็ว ๆ นี้")}
              </p>

              {/* ไอคอนเส้นแทนภาพประกอบ — วางในชิปกลม 38px ตามสเปก */}
              <div
                aria-hidden
                className="absolute top-12 left-4 grid h-[38px] w-[38px] place-items-center rounded-full border border-white/15 bg-white/10 text-art-line"
              >
                <SubjectIcon subject={s.key} />
              </div>

              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                {s.ready ? (
                  <>
                    <h3 className="m-0 font-display text-[21px] leading-tight font-semibold text-white sm:text-[25px]">
                      {en ? ({ math: "Mathematics", physics: "Physics", chemistry: "Chemistry", biology: "Biology", english: "English" } as Record<string, string>)[s.key] : s.title}
                    </h3>
                    <p className="m-0 mt-1 text-[12.5px] leading-relaxed text-white/70 sm:text-[13.5px]">
                      {en ? ({ math: "Build your foundation. Think deeper.", physics: "Understand the universe, from the smallest particles to the largest galaxies.", chemistry: "Read the world through matter and its hidden reactions.", biology: "Uncover the mechanisms behind every living thing.", english: "Better language. Bigger opportunities." } as Record<string, string>)[s.key] : s.tagline}
                    </p>
                  </>
                ) : null}

                {center && s.ready ? (
                  <>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-white/65">
                      <span className="inline-flex items-center gap-1.5">
                        <Icon name="book" size={13} /> {mathMeta.lessons} {en ? "lessons" : "บทเรียน"}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Icon name="chart" size={13} /> {mathMeta.levels}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Icon name="clock" size={13} /> ≈ {mathMeta.hours} {en ? "hrs" : "ชม."}
                      </span>
                    </div>
                    <LinkButton href="#all-lessons" variant="primary" className="mt-3.5 w-full">
                      {en ? "View all lessons" : "ดูบทเรียนทั้งหมด"}
                      <Icon name="arrow" size={15} />
                    </LinkButton>
                  </>
                ) : null}

                {center && !s.ready ? (
                  <p className="m-0 mt-3 flex items-center gap-1.5 text-[11.5px] text-white/55">
                    <Icon name="clock" size={13} /> {en ? "In development — Mathematics is currently available." : "กำลังพัฒนา — ตอนนี้เปิดเฉพาะคณิตศาสตร์"}
                  </p>
                ) : null}
              </div>

              {/* ใบข้าง: ทั้งใบเป็นปุ่มพาตัวเองมาอยู่ตรงกลาง — ใบกลางไม่มีปุ่มนี้ทับ ปุ่มข้างในจึงกดได้ */}
              {!center && far <= 2 ? (
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={en ? `View ${s.key}` : `ดูวิชา${s.title}`}
                  className="absolute inset-0 h-full w-full cursor-pointer"
                />
              ) : null}
            </article>
          );
        })}
      </div>

      {/* แถบควบคุม — ปุ่มลูกศรมีไว้ให้คนใช้คีย์บอร์ดและคนที่ไม่รู้ว่าการ์ดข้างกดได้ */}
      <div className="mt-5 flex items-center justify-center gap-4">
        <Button
          variant="ghost"
          className="border border-line-strong"
          aria-label={en ? "Previous subject" : "วิชาก่อนหน้า"}
          onClick={() => go(-1)}
        >
          <Icon name="chevron" size={15} className="rotate-180" />
        </Button>

        <div className="flex items-center gap-2">
          {SUBJECTS.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setActive(i)}
              aria-label={en ? ({ math: "Mathematics", physics: "Physics", chemistry: "Chemistry", biology: "Biology", english: "English" } as Record<string, string>)[s.key] : s.title}
              aria-current={i === active ? "true" : undefined}
              className={cx(
                "h-1.5 rounded-full transition-all duration-300 motion-reduce:transition-none",
                i === active ? "w-6 bg-ink" : "w-1.5 bg-ink-3 hover:bg-ink-2",
              )}
            />
          ))}
        </div>

        <Button
          variant="ghost"
          className="border border-line-strong"
          aria-label={en ? "Next subject" : "วิชาถัดไป"}
          onClick={() => go(1)}
        >
          <Icon name="chevron" size={15} />
        </Button>
      </div>
    </section>
  );
}
