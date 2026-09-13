"use client";

import { useEffect, useMemo, useState } from "react";
import { cx } from "@/lib/utils";
import { useSession } from "@/components/auth/SessionProvider";
import { EXAM_GROUPS, EXAM_GROUP_LABEL, type ExamGroup, type ExamSlot } from "@/content/exams";
import { formatCountdown, isStaleVerification, splitUpcomingPast } from "@/lib/exams/countdown";
import { listWatchedExamIds, unwatchExam, watchExam } from "@/lib/exams/watchlist";
import { NextExamHero } from "./NextExamHero";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";

const MYTCAS_URL = "https://www.mytcas.com/";

function bangkokDateTime(iso: string): string {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(iso));
}

function bangkokDate(iso: string): string {
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "long", timeZone: "Asia/Bangkok" }).format(
    new Date(`${iso}T00:00:00+07:00`),
  );
}

export function ExamsPageClient({ exams }: { exams: ExamSlot[] }) {
  const { user } = useSession();
  const userId = user?.id ?? null;
  const [now, setNow] = useState(() => Date.now());
  const [group, setGroup] = useState<ExamGroup | "all">("all");
  const [subject, setSubject] = useState<string>("all");
  const [watched, setWatched] = useState<Set<string>>(new Set());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!userId) {
      setWatched(new Set());
      return;
    }
    let cancelled = false;
    listWatchedExamIds(userId).then((ids) => {
      if (!cancelled) setWatched(ids);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const groupHasData = useMemo(() => {
    const has = new Set(exams.map((e) => e.examGroup));
    return (g: ExamGroup) => has.has(g);
  }, [exams]);

  const subjectsInALevel = useMemo(
    () =>
      [...new Set(exams.filter((e) => e.examGroup === "A-Level").map((e) => e.subjectName!))].sort(),
    [exams],
  );

  const filtered = useMemo(() => {
    return exams.filter((e) => {
      if (group !== "all" && e.examGroup !== group) return false;
      if (group === "A-Level" && subject !== "all" && e.subjectName !== subject) return false;
      return true;
    });
  }, [exams, group, subject]);

  const { upcoming, past } = useMemo(() => splitUpcomingPast(filtered, now), [filtered, now]);

  async function toggleWatch(examId: string) {
    if (!userId) return;
    if (watched.has(examId)) {
      await unwatchExam(userId, examId);
      setWatched((s) => {
        const next = new Set(s);
        next.delete(examId);
        return next;
      });
    } else {
      await watchExam(userId, examId);
      setWatched((s) => new Set(s).add(examId));
    }
  }

  const noDataForGroup = group !== "all" && !groupHasData(group);

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <header className="mb-6 border-b border-line pb-6">
        <Eyebrow>นับถอยหลัง</Eyebrow>
        <h1 className="m-0 mb-3 font-display text-[clamp(26px,4vw,38px)] font-bold tracking-tight text-ink">
          ตารางสอบ TGAT / TPAT / A-Level
        </h1>
        <p className="m-0 text-[14.5px] leading-relaxed text-ink-3">
          ข้อมูลนี้รวบรวมเพื่อความสะดวก ยึดประกาศจากแหล่งทางการเป็นหลักเสมอ —{" "}
          <a href={MYTCAS_URL} target="_blank" rel="noreferrer" className="text-accent-ink">
            ดูที่ mytcas.com
          </a>
        </p>
      </header>

      <NextExamHero
        exams={exams}
        now={now}
        watchedIds={watched}
        canWatch={!!userId}
        onToggleWatch={toggleWatch}
      />

      <div className="mb-6 flex flex-wrap gap-1.5">
        <Button
          variant={group === "all" ? "secondary" : "ghost"}
          onClick={() => {
            setGroup("all");
            setSubject("all");
          }}
        >
          ทั้งหมด
        </Button>
        {EXAM_GROUPS.map((g) => (
          <Button
            key={g}
            variant={group === g ? "secondary" : "ghost"}
            className={cx(!groupHasData(g) && group !== g && "opacity-50")}
            onClick={() => {
              setGroup(g);
              setSubject("all");
            }}
          >
            {g}
          </Button>
        ))}
      </div>

      {group === "A-Level" && subjectsInALevel.length > 0 ? (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-[13px] text-ink-3">วิชา:</span>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="rounded-field border border-line-strong bg-surface-2 px-3 py-1.5 text-[13px] text-ink"
          >
            <option value="all">ทุกวิชา</option>
            {subjectsInALevel.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {noDataForGroup ? (
        <p className="m-0 rounded-card border border-dashed border-line-strong bg-surface-2 px-4 py-8 text-center text-[14px] text-ink-3">
          ยังไม่มีข้อมูล {EXAM_GROUP_LABEL[group as ExamGroup]} ในระบบนี้ — ดูรอบสอบล่าสุดที่{" "}
          <a href={MYTCAS_URL} target="_blank" rel="noreferrer" className="text-accent-ink">
            mytcas.com
          </a>
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {upcoming.length === 0 ? (
              <p className="m-0 rounded-card border border-dashed border-line-strong bg-surface-2 px-4 py-6 text-center text-[14px] text-ink-3">
                ไม่มีสนามสอบที่ตรงกับตัวกรองนี้
              </p>
            ) : (
              upcoming.map((e) => (
                <ExamCard
                  key={e.id}
                  exam={e}
                  now={now}
                  watched={watched.has(e.id)}
                  canWatch={!!userId}
                  onToggleWatch={() => toggleWatch(e.id)}
                />
              ))
            )}
          </div>

          {past.length > 0 ? (
            <div className="mt-10">
              <h2 className="m-0 mb-3 font-display text-[16px] font-semibold text-ink-2">
                สอบผ่านไปแล้ว
              </h2>
              <div className="flex flex-col gap-3 opacity-70">
                {past.map((e) => (
                  <ExamCard
                    key={e.id}
                    exam={e}
                    now={now}
                    watched={watched.has(e.id)}
                    canWatch={!!userId}
                    onToggleWatch={() => toggleWatch(e.id)}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function ExamCard({
  exam,
  now,
  watched,
  canWatch,
  onToggleWatch,
}: {
  exam: ExamSlot;
  now: number;
  watched: boolean;
  canWatch: boolean;
  onToggleWatch: () => void;
}) {
  const stale = isStaleVerification(exam.verifiedAt, now);
  const title = `${EXAM_GROUP_LABEL[exam.examGroup]}${exam.subjectName ? ` — ${exam.subjectName}` : ""} (${exam.examYear})`;

  return (
    <div className="rounded-card border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="m-0 font-display text-[16px] font-semibold text-ink">{title}</p>
          {exam.startsOn ? (
            <p className="m-0 mt-0.5 text-[13px] tabular-nums text-ink-2">
              {bangkokDateTime(exam.startsOn)}
              {exam.endsOn ? ` – ${bangkokDateTime(exam.endsOn)}` : ""}
            </p>
          ) : (
            <p className="m-0 mt-0.5 text-[13px] text-ink-3">ยังไม่ประกาศวันสอบ</p>
          )}
        </div>
        {canWatch ? (
          <Button variant={watched ? "secondary" : "ghost"} className="shrink-0" onClick={onToggleWatch}>
            {watched ? "กำลังติดตาม ✓" : "ติดตาม"}
          </Button>
        ) : null}
      </div>

      {exam.startsOn ? <Countdown targetIso={exam.startsOn} now={now} /> : null}

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <StatusBadge status={exam.status} />
        {stale ? (
          <span className="rounded-pill bg-warn-soft px-2 py-0.5 text-[11.5px] font-medium text-ink">
            ข้อมูลอาจไม่อัปเดต
          </span>
        ) : null}
      </div>

      {exam.status === "tentative" ? (
        <p className="m-0 mt-2 text-[12.5px] text-ink-3">
          วันที่ที่แสดงเป็นการคาดการณ์จากปีก่อน ยังไม่ใช่ประกาศจริง
        </p>
      ) : null}
      {exam.status === "waiting" ? (
        <p className="m-0 mt-2 text-[12.5px] text-ink-3">
          รอประกาศจากแหล่งทางการ —{" "}
          <a href={MYTCAS_URL} target="_blank" rel="noreferrer" className="text-accent-ink">
            ตรวจสอบที่ mytcas.com
          </a>
        </p>
      ) : null}

      <p className="m-0 mt-3 text-[11.5px] text-ink-3">
        แหล่งอ้างอิงทางการ:{" "}
        <a href={exam.sourceUrl} target="_blank" rel="noreferrer" className="text-accent-ink">
          {exam.sourceName}
        </a>{" "}
        · ตรวจสอบล่าสุด {bangkokDate(exam.verifiedAt)}
      </p>
      {exam.note ? <p className="m-0 mt-1 text-[12px] text-ink-3">{exam.note}</p> : null}

      {exam.crossChecked.length > 0 ? (
        <details className="mt-2">
          <summary className="cursor-pointer text-[11.5px] text-ink-3 hover:text-ink">
            แหล่งที่ใช้ตรวจเทียบ ({exam.crossChecked.length})
          </summary>
          <ul className="m-0 mt-1.5 flex list-none flex-col gap-1 p-0 pl-1">
            {exam.crossChecked.map((c) => (
              <li key={c.url} className="text-[11.5px] text-ink-3">
                <a href={c.url} target="_blank" rel="noreferrer" className="text-accent-ink">
                  {c.name}
                </a>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status: ExamSlot["status"] }) {
  const label = status === "confirmed" ? "ประกาศแล้ว" : status === "tentative" ? "คาดการณ์" : "รอประกาศ";
  const tone =
    status === "confirmed"
      ? "bg-ok-soft text-ink"
      : status === "tentative"
        ? "bg-accent-soft text-ink"
        : "bg-surface-2 text-ink-3";
  return <span className={cx("rounded-pill px-2 py-0.5 text-[11.5px] font-medium", tone)}>{label}</span>;
}

function Countdown({ targetIso, now }: { targetIso: string; now: number }) {
  const c = formatCountdown(targetIso, now);
  if (c.isPast) {
    return <p className="m-0 mt-1.5 text-[13px] text-ink-3">ผ่านไปแล้ว</p>;
  }
  return (
    // suppressHydrationWarning: คำนวณจาก Date.now() ทั้ง SSR และ hydrate ต่างกันได้ไม่กี่วินาที
    // โดยตั้งใจ ตัวจับเวลาที่ tick ทุกวินาทีแก้ค่าให้ตรงเองในติ๊กถัดไป ไม่ใช่บั๊ก
    <p
      suppressHydrationWarning
      className="m-0 mt-1.5 font-display text-[15px] font-semibold tabular-nums text-accent-ink"
    >
      เหลือ {c.days} วัน {String(c.hours).padStart(2, "0")}:{String(c.minutes).padStart(2, "0")}:
      {String(c.seconds).padStart(2, "0")}
    </p>
  );
}
