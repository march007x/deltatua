"use client";

import { EXAM_GROUP_LABEL, type ExamSlot } from "@/content/exams";
import { formatCountdown, nextDeadline } from "@/lib/exams/countdown";
import { Button, LinkButton } from "@/components/ui/Button";

const MYTCAS_URL = "https://www.mytcas.com/";

/** เฉพาะ "วันที่" ไม่มีเวลา — ใช้กับวันปิดรับสมัครเพราะเวลา 23:59 ที่ใช้คำนวณนับถอยหลังภายในเป็น
 * ค่าที่เราสมมติเอง (ตารางต้นทางให้แค่วันที่) ห้ามพิมพ์เวลาที่ไม่รู้จริงออกจอ */
function bangkokDateOnly(iso: string): string {
  return new Intl.DateTimeFormat("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(new Date(iso));
}

function bangkokTimeRange(startIso: string, endIso?: string): string {
  const fmt = new Intl.DateTimeFormat("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  });
  return endIso
    ? `${fmt.format(new Date(startIso))}-${fmt.format(new Date(endIso))} น.`
    : `${fmt.format(new Date(startIso))} น.`;
}

interface Props {
  exams: ExamSlot[];
  now: number;
  watchedIds: Set<string>;
  canWatch: boolean;
  onToggleWatch: (examId: string) => void;
}

/**
 * ป้ายใหญ่สนามสอบที่ใกล้ที่สุด — ใช้ nextDeadline() (src/lib/exams/countdown.ts) ที่ไล่เทียบ
 * ทั้ง "วันสอบ" และ "วันปิดรับสมัคร" ของทุกแถวพร้อมกัน ไม่ใช่แค่ดูวันปิดรับสมัครของแถวที่วันสอบ
 * ใกล้ที่สุดแถวเดียว (แถวอื่นอาจปิดรับสมัครเร็วกว่ามาก เช่น TPAT1 ปิดรับสมัคร ก.ย. แม้วันสอบจะอยู่
 * ก.พ. ปีถัดไปก็ตาม) ไม่เขียนลอจิกเรียงลำดับซ้ำในไฟล์นี้
 *
 * ตัวเลขคำนวณจาก Date.now() ตรง ๆ ตอน render ครั้งแรก (ไม่รอ useEffect) ทำให้ทั้งฝั่งเซิร์ฟเวอร์
 * ตอน SSR และฝั่งไคลเอนต์ตอน hydrate เห็นตัวเลขจริงทันที ไม่กะพริบเป็นช่องว่างก่อน
 */
export function NextExamHero({ exams, now, watchedIds, canWatch, onToggleWatch }: Props) {
  const deadline = nextDeadline(exams, now);

  if (!deadline) {
    return (
      <section className="mb-8 rounded-card border border-line bg-surface p-6 text-center">
        <p className="m-0 mb-2 text-[16px] font-semibold text-ink">รอบนี้สอบครบทุกสนามแล้ว</p>
        <p className="m-0 text-[14px] text-ink-3">
          ยังไม่มีประกาศสนามสอบถัดไปในระบบนี้ —{" "}
          <a href={MYTCAS_URL} target="_blank" rel="noreferrer" className="text-accent-ink">
            ดูรอบถัดไปที่ mytcas.com
          </a>
        </p>
      </section>
    );
  }

  const { exam: nearest, kind } = deadline;
  const c = formatCountdown(new Date(deadline.at).toISOString(), now);
  const watched = watchedIds.has(nearest.id);
  const title = `${EXAM_GROUP_LABEL[nearest.examGroup]}${nearest.subjectName ? ` — ${nearest.subjectName}` : ""}`;

  const segments = [
    { v: c.days, label: "วัน" },
    { v: c.hours, label: "ชม." },
    { v: c.minutes, label: "นาที" },
    { v: c.seconds, label: "วิ" },
  ];

  return (
    <section className="mb-8 rounded-card bg-countdown-fill p-6 shadow-sh-3 sm:p-8">
      <p className="m-0 mb-3 text-[13px] font-medium text-countdown-on/80">
        {kind === "registration" ? `ปิดรับสมัคร ${title} ในอีก` : `สอบ ${title} ในอีก`}
      </p>

      <div className="mb-4 grid grid-cols-4 gap-2 sm:gap-3">
        {segments.map((seg) => (
          <div key={seg.label} className="rounded-field bg-countdown-tile px-2 py-3 text-center shadow-sh-1">
            {/* suppressHydrationWarning: ตัวเลขคำนวณจาก Date.now() ทั้งตอน SSR และตอน hydrate
                เวลาที่ต่างกันไม่กี่วินาทีระหว่างสองจังหวะนี้ทำให้ค่าต่างกันได้เสมอโดยตั้งใจ
                ไม่ใช่บั๊ก — ตัวจับเวลาที่ tick ทุกวินาทีจะแก้ค่าให้ตรงเองในติ๊กถัดไปอยู่แล้ว */}
            <p
              suppressHydrationWarning
              className="m-0 font-display text-[clamp(26px,6vw,44px)] font-bold tabular-nums leading-none text-countdown-tile-ink"
            >
              {String(seg.v).padStart(2, "0")}
            </p>
            <p className="m-0 mt-1 text-[11.5px] text-countdown-tile-ink/70">{seg.label}</p>
          </div>
        ))}
      </div>

      <p className="m-0 mb-1 font-display text-[19px] font-semibold text-countdown-on">
        {title} ({nearest.examYear})
      </p>

      {kind === "registration" ? (
        <>
          <p className="m-0 text-[14px] text-countdown-on/90">ปิดรับสมัคร {bangkokDateOnly(nearest.registrationClosesOn!)}</p>
          {nearest.startsOn ? (
            <p className="m-0 mb-4 text-[13px] text-countdown-on/70">
              สอบ {bangkokDateOnly(nearest.startsOn)} · {bangkokTimeRange(nearest.startsOn, nearest.endsOn)}
            </p>
          ) : (
            <div className="mb-4" />
          )}
        </>
      ) : (
        <p className="m-0 mb-4 text-[14px] text-countdown-on/90">
          {bangkokDateOnly(nearest.startsOn!)} · {bangkokTimeRange(nearest.startsOn!, nearest.endsOn)}
        </p>
      )}

      {canWatch ? (
        watched ? (
          <LinkButton href="/plan" variant="primary">
            ไปหน้าวางแผน →
          </LinkButton>
        ) : (
          <Button variant="primary" onClick={() => onToggleWatch(nearest.id)}>
            ติดตามสนามสอบนี้
          </Button>
        )
      ) : null}
    </section>
  );
}
