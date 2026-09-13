"use client";

import Link from "next/link";
import { useExamResults } from "@/lib/progress/exam";
import { useSession } from "@/components/auth/SessionProvider";
import type { ExamSetMeta } from "@/lib/repo/exam";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";

function clock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  return `${m} นาที`;
}

export function ExamIndex({ sets }: { sets: ExamSetMeta[] }) {
  const { map, ready, reset } = useExamResults();
  const { user } = useSession();

  const taken = sets.filter((s) => map[s.id]);
  // รวมบทที่อ่อนจากทุกชุดที่เคยทำ แล้วนับความถี่ — บทที่โผล่ซ้ำคือจุดอ่อนจริง ไม่ใช่พลาดครั้งเดียว
  const weakCount = new Map<string, number>();
  for (const s of taken) {
    for (const c of map[s.id]?.weakChapters ?? []) {
      weakCount.set(c, (weakCount.get(c) ?? 0) + 1);
    }
  }
  const weak = [...weakCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  const byCourse = new Map<string, ExamSetMeta[]>();
  for (const s of sets) {
    const list = byCourse.get(s.courseTitle) ?? [];
    list.push(s);
    byCourse.set(s.courseTitle, list);
  }

  return (
    <div>
      {ready && taken.length > 0 ? (
        <div className="mb-9 rounded-card border border-line bg-surface p-5">
          <Eyebrow>สรุปของคุณ</Eyebrow>
          <p className="m-0 font-display text-[17px] font-semibold text-ink">
            ทำข้อสอบจำลองแล้ว {taken.length} ชุด
          </p>
          {weak.length > 0 ? (
            <>
              <p className="m-0 mt-2 text-[15px] leading-relaxed text-ink-2">
                บทที่ทำได้ต่ำกว่า 70% (ตัวเลขคือจำนวนชุดที่พลาดบทนี้):
              </p>
              <ul className="m-0 mt-2 flex list-none flex-wrap gap-2 p-0">
                {weak.map(([chapter, n]) => (
                  <li
                    key={chapter}
                    className="rounded-pill border border-danger bg-danger-soft px-2.5 py-1 text-[13.5px] text-ink"
                  >
                    {chapter} × {n}
                  </li>
                ))}
              </ul>
              <p className="m-0 mt-2 text-[14px] text-ink-3">
                บทที่โผล่ซ้ำหลายชุดคือจุดอ่อนจริง ไม่ใช่พลาดเพราะเผลอ —{" "}
                <Link href="/practice" className="text-accent-ink">
                  ไปฝึกบทเหล่านี้ก่อน
                </Link>
              </p>
            </>
          ) : (
            <p className="m-0 mt-1 text-[15px] text-ink-2">ทุกบทผ่านเกณฑ์ 70% แล้ว</p>
          )}
          {/* ปุ่มนี้ล้างเฉพาะข้อมูลที่ยังค้างอยู่ในเบราว์เซอร์นี้ — สำหรับสมาชิกที่ล็อกอินอยู่
              ผลส่วนใหญ่ซิงก์ขึ้นบัญชีไปแล้วจึงไม่มีอะไรให้ล้าง (ลบข้อมูลบัญชีทำได้ที่หน้าบัญชีแทน)
              ซ่อนไว้เพื่อไม่ให้ดูเหมือนกดแล้วไม่มีผลอะไรเลย */}
          {!user ? (
            <Button
              variant="ghost"
              className="mt-3"
              onClick={() => {
                if (confirm("ลบผลข้อสอบจำลองทั้งหมดในเบราว์เซอร์นี้?")) void reset();
              }}
            >
              ล้างผลทั้งหมด
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-9">
        {[...byCourse.entries()].map(([course, list]) => (
          <section key={course}>
            <h2 className="m-0 mb-4 border-b-2 border-ink pb-2 font-display text-[20px] font-semibold text-ink">
              {course}
            </h2>
            <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-3">
              {list.map((s) => {
                const r = ready ? map[s.id] : undefined;
                return (
                  <li key={s.id}>
                    <Link
                      href={`/exam/${s.id}`}
                      className="block h-full rounded-field border border-line bg-surface px-4 py-3 no-underline hover:border-accent"
                    >
                      <p className="m-0 font-display text-[16px] font-semibold text-ink">
                        ชุดที่ {s.round}
                      </p>
                      <p className="m-0 text-[12.5px] text-ink-3">
                        {s.count} ข้อ · {clock(s.minutes * 60)}
                      </p>
                      <p className="m-0 mt-1.5 text-[12.5px] tabular-nums text-ink-2">
                        {r ? `เคยได้ ${r.correct}/${r.total}` : "ยังไม่ได้ทำ"}
                      </p>
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
