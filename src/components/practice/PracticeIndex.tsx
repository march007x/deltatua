"use client";

import { useMemo } from "react";
import Link from "next/link";
import { formatPracticeResult, needsReview, usePracticeResults } from "@/lib/progress/practice";
import { useSession } from "@/components/auth/SessionProvider";
import type { PracticeSummary } from "@/lib/repo/practice";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";

/**
 * หน้ารวมชุดฝึก — จุดสำคัญคือ **ชี้ให้เห็นบทที่ควรทบทวนก่อน** ไม่ใช่แค่แสดงรายการ
 * ผู้เรียนคนเดียวไม่มีครูคอยบอกว่าอ่อนตรงไหน ตัวเลขในหน้านี้จึงทำหน้าที่นั้นแทน
 */
export function PracticeIndex({ sets }: { sets: PracticeSummary[] }) {
  const totals = useMemo(
    () => Object.fromEntries(sets.map((s) => [s.slug, s.count])),
    [sets],
  );
  const { map, ready, reset } = usePracticeResults(totals);
  const { user } = useSession();

  const done = sets.filter((s) => map[s.slug]);
  const weak = done.filter((s) => {
    const r = map[s.slug];
    return r && needsReview(r);
  });
  const totalAnswered = done.reduce((n, s) => n + (map[s.slug]?.total ?? 0), 0);
  const totalCorrect = done.reduce((n, s) => n + (map[s.slug]?.correct ?? 0), 0);

  const byCourse = new Map<string, PracticeSummary[]>();
  for (const s of sets) {
    const list = byCourse.get(s.course) ?? [];
    list.push(s);
    byCourse.set(s.course, list);
  }

  return (
    <div>
      {ready && done.length > 0 ? (
        <div className="mb-9 rounded-card border border-line bg-surface p-5">
          <Eyebrow>สรุปของคุณ</Eyebrow>
          <p className="m-0 mb-1 font-display text-[17px] font-semibold text-ink">
            ทำแล้ว {done.length} ชุด · ถูก {totalCorrect} จาก {totalAnswered} ข้อ
          </p>
          {weak.length > 0 ? (
            <>
              <p className="m-0 mt-2 text-[15px] leading-relaxed text-ink-2">
                บทที่ทำได้ต่ำกว่า 70% และควรกลับไปอ่านก่อนทำใหม่:
              </p>
              <ul className="m-0 mt-2 flex list-none flex-wrap gap-2 p-0">
                {weak.map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/lesson/${s.slug}`}
                      className="rounded-pill border border-danger bg-danger-soft px-2.5 py-1 text-[13.5px] text-ink no-underline"
                    >
                      {s.title} ({formatPracticeResult(map[s.slug]!)})
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="m-0 mt-1 text-[15px] text-ink-2">
              ทุกชุดที่ทำผ่านเกณฑ์ 70% แล้ว — ทำชุดที่ยังไม่ได้ทำต่อได้เลย
            </p>
          )}
          {/* ปุ่มนี้ล้างเฉพาะข้อมูลที่ยังค้างอยู่ในเบราว์เซอร์นี้ — สำหรับสมาชิกที่ล็อกอินอยู่
              ผลส่วนใหญ่ซิงก์ขึ้นบัญชีไปแล้วจึงไม่มีอะไรให้ล้าง (ลบข้อมูลบัญชีทำได้ที่หน้าบัญชีแทน)
              ซ่อนไว้เพื่อไม่ให้ดูเหมือนกดแล้วไม่มีผลอะไรเลย */}
          {!user ? (
            <Button
              variant="ghost"
              className="mt-3"
              onClick={() => {
                if (confirm("ลบผลการฝึกทั้งหมดในเบราว์เซอร์นี้?")) void reset();
              }}
            >
              ล้างผลทั้งหมด
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-10">
        {[...byCourse.entries()].map(([course, list]) => (
          <section key={course}>
            <h2 className="m-0 mb-4 border-b-2 border-ink pb-2 font-display text-[20px] font-semibold text-ink">
              {course}
            </h2>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {list.map((s) => {
                const r = ready ? map[s.slug] : undefined;
                return (
                  <li key={s.slug}>
                    <Link
                      href={`/practice/${s.slug}`}
                      className="flex items-center gap-3 rounded-field border border-line bg-surface px-4 py-3 no-underline hover:border-accent"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="m-0 font-display text-[16px] font-semibold text-ink">
                          {s.title}
                        </p>
                        <p className="m-0 text-[12.5px] text-ink-3">
                          {s.chapter} · {s.count} ข้อ
                          {s.numericCount > 0 ? ` · กรอกเอง ${s.numericCount}` : ""}
                        </p>
                      </div>
                      {r ? (
                        <span
                          className={`shrink-0 rounded-pill border px-2 py-1 text-[12.5px] font-medium tabular-nums ${
                            needsReview(r)
                              ? "border-danger bg-danger-soft text-ink"
                              : "border-ok bg-ok-soft text-ink"
                          }`}
                        >
                          {formatPracticeResult(r)}
                        </span>
                      ) : (
                        <span className="shrink-0 text-[12.5px] text-ink-3">ยังไม่ทำ</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
