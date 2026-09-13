"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ProgressLesson } from "@/lib/repo/progress-index";
import type { usePlanner } from "@/lib/planner/useActivePlan";
import { DAY_MS, WEEKDAY_KEYS, formatIsoDate, parseIsoDate, type WeekdayKey } from "@/lib/planner/generate";
import { isItemDone, computePlanStatus } from "@/lib/planner/status";
import { cx } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

const WEEKDAY_LABEL: Record<WeekdayKey, string> = {
  mon: "จันทร์",
  tue: "อังคาร",
  wed: "พุธ",
  thu: "พฤหัส",
  fri: "ศุกร์",
  sat: "เสาร์",
  sun: "อาทิตย์",
};

/** ตัวย่อวันจริง ไม่ใช่ตัดคำเต็มที่ตัวอักษรที่ 2 (ที่เคยทำให้ "พฤหัส"/"เสาร์" กลายเป็นคำอ่านไม่ออก) */
const WEEKDAY_SHORT: Record<WeekdayKey, string> = {
  sun: "อา",
  mon: "จ",
  tue: "อ",
  wed: "พ",
  thu: "พฤ",
  fri: "ศ",
  sat: "เส",
};

const todayIso = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());

type Planner = ReturnType<typeof usePlanner>;

export function PlanBoard({ planner, lessons }: { planner: Planner; lessons: ProgressLesson[] }) {
  const { plan, items, lessonProgress } = planner;
  const [replanOpen, setReplanOpen] = useState(false);
  const [pushDays, setPushDays] = useState(3);
  const [extraMinutes, setExtraMinutes] = useState(15);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const status = useMemo(
    () =>
      plan ? computePlanStatus(items, lessons, lessonProgress, plan.examDate, todayIso) : null,
    [plan, items, lessons, lessonProgress],
  );

  const weeks = useMemo(() => {
    if (!plan) return [];
    const startMs = parseIsoDate(plan.startDate);
    const examMs = parseIsoDate(plan.examDate);
    const dates: string[] = [];
    for (let t = startMs; t <= examMs; t += DAY_MS) dates.push(formatIsoDate(t));
    const chunks: string[][] = [];
    for (let i = 0; i < dates.length; i += 7) chunks.push(dates.slice(i, i + 7));
    return chunks;
  }, [plan]);

  const itemsByDate = useMemo(() => {
    const m = new Map<string, typeof items>();
    for (const it of items) {
      const list = m.get(it.date) ?? [];
      list.push(it);
      m.set(it.date, list);
    }
    for (const list of m.values()) list.sort((a, b) => a.sortOrder - b.sortOrder);
    return m;
  }, [items]);

  if (!plan || !status) return null;

  async function handleDrop(date: string, itemId: string) {
    if (date === plan!.examDate) return; // ไม่วางรายการลงวันสอบเอง
    await planner.moveItem(itemId, date);
  }

  async function handleRemove(itemId: string) {
    setBusy(true);
    await planner.removeItem(itemId);
    setBusy(false);
  }

  async function handlePush() {
    setBusy(true);
    const r = await planner.replanPushDays(pushDays, lessons);
    setBusy(false);
    setNote(
      r.shortfallMinutes > 0
        ? `เลื่อนแผนแล้ว แต่ยังขาดเวลาอีกประมาณ ${r.shortfallMinutes} นาทีกว่าจะครบก่อนวันสอบ`
        : "เลื่อนแผนเรียบร้อย เวลาว่างพอสำหรับบทที่เหลือทั้งหมด",
    );
  }

  async function handleAddMinutes() {
    setBusy(true);
    const r = await planner.replanAddMinutes(extraMinutes, lessons);
    setBusy(false);
    setNote(
      r.shortfallMinutes > 0
        ? `เพิ่มเวลาแล้ว แต่ยังขาดเวลาอีกประมาณ ${r.shortfallMinutes} นาทีกว่าจะครบก่อนวันสอบ`
        : "เพิ่มเวลาต่อวันเรียบร้อย เวลาว่างพอสำหรับบทที่เหลือทั้งหมด",
    );
  }

async function handleToggleWeekday(weekday: WeekdayKey) {
    const current = plan!.minutesPerDay[weekday];
    const fallback = Math.max(...Object.values(plan!.minutesPerDay).filter((m) => m > 0), 30);
    setBusy(true);
    const r = await planner.setDayMinutes(weekday, current > 0 ? 0 : fallback, lessons);
    setBusy(false);
    setNote(
      r.shortfallMinutes > 0
        ? `ปรับวัน${WEEKDAY_LABEL[weekday]}แล้ว แต่ยังขาดเวลาอีกประมาณ ${r.shortfallMinutes} นาทีกว่าจะครบก่อนวันสอบ`
        : null,
    );
  }

  const paceLabel =
    status.pace === "behind"
      ? `ช้ากว่าแผน ${status.paceDays} วัน`
      : status.pace === "ahead"
        ? `เร็วกว่าแผน ${status.paceDays} วัน`
        : "ตามแผน";

  return (
    <div className="flex flex-col gap-6">
      <section
        className={cx(
          "rounded-card border p-5",
          status.pace === "behind" ? "border-danger bg-danger-soft" : "border-accent bg-accent-soft",
        )}
      >
        <p className="m-0 mb-1 text-[12.5px] font-medium text-ink-3">
          {paceLabel} · เหลืออีก {status.daysRemaining} วันถึงวันสอบ
        </p>
        <p className="m-0 mb-3 text-[16px] leading-relaxed text-ink">
          เหลือ {status.remainingLessonsCount} บท {status.remainingMinutes} นาที
          {status.daysRemaining > 0
            ? ` — ถ้าเรียนวันละ ${status.minutesPerDayNeeded} นาทีจะทันพอดี`
            : ""}
        </p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {WEEKDAY_KEYS.map((wd) => {
            const on = plan.minutesPerDay[wd] > 0;
            return (
              <button
                key={wd}
                type="button"
                disabled={busy}
                onClick={() => handleToggleWeekday(wd)}
                title={on ? `วัน${WEEKDAY_LABEL[wd]}: ว่าง ${plan.minutesPerDay[wd]} นาที — กดเพื่อปิดวันนี้` : `วัน${WEEKDAY_LABEL[wd]}: ปิดอยู่ — กดเพื่อเปิด`}
                className={cx(
                  "flex h-11 w-11 items-center justify-center rounded-pill border text-[13px] font-medium",
                  on
                    ? "border-ok bg-ok-soft text-ink"
                    : "border-line-strong bg-surface text-ink-3 line-through",
                )}
              >
                {WEEKDAY_SHORT[wd]}
              </button>
            );
          })}
        </div>

        <Button variant="secondary" onClick={() => setReplanOpen((v) => !v)}>
          {replanOpen ? "ปิดตัวจัดแผนใหม่" : "จัดแผนใหม่ (ตามไม่ทัน)"}
        </Button>

        {replanOpen ? (
          <div className="mt-3 flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13.5px] text-ink-2">เลื่อนจุดเริ่มจัดตารางที่เหลือไป</span>
              <input
                type="number"
                min={1}
                max={60}
                value={pushDays}
                onChange={(e) => setPushDays(Number(e.target.value))}
                className="w-16 rounded-field border border-line-strong bg-surface-2 px-2 py-1 text-center text-[13.5px] tabular-nums text-ink"
              />
              <span className="text-[13.5px] text-ink-2">วันจากวันนี้</span>
              <Button variant="primary" disabled={busy} onClick={handlePush}>
                ใช้ทางเลือกนี้
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13.5px] text-ink-2">เพิ่มเวลาว่างวันละ</span>
              <input
                type="number"
                min={5}
                max={240}
                step={5}
                value={extraMinutes}
                onChange={(e) => setExtraMinutes(Number(e.target.value))}
                className="w-16 rounded-field border border-line-strong bg-surface-2 px-2 py-1 text-center text-[13.5px] tabular-nums text-ink"
              />
              <span className="text-[13.5px] text-ink-2">นาที (ทุกวัน)</span>
              <Button variant="primary" disabled={busy} onClick={handleAddMinutes}>
                ใช้ทางเลือกนี้
              </Button>
            </div>
            <p className="m-0 text-[12.5px] text-ink-3">
              ทางเลือกที่ 3 — ตัดบทที่ไม่จำเป็น: กดปุ่ม × บนการ์ดบทที่อยากตัดออกจากแผนได้โดยตรงด้านล่าง
            </p>
            {note ? <p className="m-0 text-[13px] text-accent-ink">{note}</p> : null}
          </div>
        ) : null}
      </section>

      <div className="flex flex-col gap-4">
        {weeks.map((week, wi) => (
          <div key={wi} className="rounded-card border border-line bg-surface p-3 sm:p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
              {week.map((date) => {
                const weekday = WEEKDAY_KEYS[new Date(parseIsoDate(date)).getUTCDay()]!;
                const dayItems = itemsByDate.get(date) ?? [];
                const isExamDay = date === plan.examDate;
                const isPast = date < todayIso;
                const isToday = date === todayIso;
                return (
                  <div
                    key={date}
                    onDragOver={(e) => !isExamDay && e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const itemId = e.dataTransfer.getData("text/plain");
                      if (itemId) void handleDrop(date, itemId);
                    }}
                    className={cx(
                      "min-h-[96px] rounded-tile border p-2.5",
                      isExamDay
                        ? "border-danger bg-danger-soft"
                        : isToday
                          ? "border-accent bg-accent-soft"
                          : "border-line bg-surface-2",
                    )}
                  >
                    <p className="m-0 mb-1.5 text-[11.5px] font-medium text-ink-3">
                      {WEEKDAY_LABEL[weekday]} · {date.slice(5)}
                      {isExamDay ? " · วันสอบ" : ""}
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {dayItems.map((it) => {
                        const done = isItemDone(it, lessons, lessonProgress);
                        return (
                          <div
                            key={it.id}
                            draggable={!isPast}
                            onDragStart={(e) => e.dataTransfer.setData("text/plain", it.id)}
                            className={cx(
                              "flex items-start gap-1.5 rounded-field border px-2.5 py-2 text-[12.5px]",
                              done ? "border-ok bg-ok-soft text-ink" : "border-line bg-surface text-ink",
                              !isPast && "cursor-grab",
                            )}
                          >
                            <span className="min-w-0 flex-1 break-words">
                              {done ? "✓ " : ""}
                              {it.title}
                              <span className="ml-1 text-ink-3">({it.minutesPlanned} นาที)</span>
                            </span>
                            <div className="flex shrink-0 flex-col items-end gap-1">
                              {!done ? (
                                <Link
                                  href={`/lesson/${it.refId}`}
                                  className="rounded bg-ink px-1.5 py-0.5 text-[10.5px] font-medium text-bg no-underline"
                                >
                                  เริ่ม
                                </Link>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => handleRemove(it.id)}
                                aria-label="ตัดออกจากแผน"
                                className="text-[11px] text-ink-3 hover:text-danger"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
