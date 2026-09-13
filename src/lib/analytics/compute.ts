import { bangkokDateKey, bangkokDateLabel, keyToBangkokMidnight, lastNDayKeys, rangeLabel } from "./dates";

/** เกณฑ์ขั้นต่ำก่อนจะถือว่ากราฟมีข้อมูลพอให้อ่านความหมายได้ — ต่ำกว่านี้ให้บอกตรง ๆ ว่าขาดอะไรอีกเท่าไร */
const MIN_ACCURACY_DAYS = 3;
const MIN_TOPIC_ATTEMPTS = 5;

export interface AttemptInput {
  isCorrect: boolean;
  createdAt: number;
  lessonId: string;
}

export interface SessionInput {
  minutes: number;
  startedAt: number;
}

export interface LessonProgressInput {
  completedAt?: number;
}

export interface ExamResultInput {
  score: number;
  maxScore: number;
  takenAt: number;
}

// ---------- 1. ความแม่นยำรายวัน 30 วันล่าสุด ----------

export interface DailyAccuracyPoint {
  date: string;
  label: string;
  correct: number;
  total: number;
  pct: number;
  /** ตำแหน่งวันภายในหน้าต่าง 0..days-1 — ใช้จัดระยะห่างแนวนอนให้เป็นสัดส่วนกับเวลาจริง (ไม่บีบช่องว่างให้ติดกัน) */
  dayIndex: number;
}

export interface DailyAccuracyResult {
  ready: boolean;
  message?: string;
  points: DailyAccuracyPoint[];
  rangeLabel: string;
}

export function computeDailyAccuracy(
  attempts: AttemptInput[],
  days = 30,
  now = Date.now(),
): DailyAccuracyResult {
  const orderedKeys = lastNDayKeys(days, now);
  const keyIndex = new Map(orderedKeys.map((k, i) => [k, i]));
  const byDay = new Map<string, { correct: number; total: number }>();
  for (const a of attempts) {
    const key = bangkokDateKey(a.createdAt);
    if (!keyIndex.has(key)) continue;
    const cur = byDay.get(key) ?? { correct: 0, total: 0 };
    cur.total++;
    if (a.isCorrect) cur.correct++;
    byDay.set(key, cur);
  }

  const activeDays = byDay.size;
  if (activeDays < MIN_ACCURACY_DAYS) {
    return {
      ready: false,
      message: `ทำโจทย์มาแล้ว ${activeDays} วันจาก ${days} วันล่าสุด — ทำเพิ่มอีกอย่างน้อย ${
        MIN_ACCURACY_DAYS - activeDays
      } วันที่ต่างกันถึงจะเห็นกราฟนี้`,
      points: [],
      rangeLabel: rangeLabel(days, now),
    };
  }

  const points = [...byDay.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([key, v]) => ({
      date: key,
      label: bangkokDateLabel(keyToBangkokMidnight(key)),
      correct: v.correct,
      total: v.total,
      pct: Math.round((v.correct / v.total) * 100),
      dayIndex: keyIndex.get(key)!,
    }));

  return { ready: true, points, rangeLabel: rangeLabel(days, now) };
}

// ---------- 2. นาทีที่เรียนจริงต่อวัน 14 วันล่าสุด ----------

export interface DailyMinutesPoint {
  date: string;
  label: string;
  minutes: number;
}

export interface DailyMinutesResult {
  ready: boolean;
  message?: string;
  points: DailyMinutesPoint[];
  /** ค่าเฉลี่ยของช่วงที่แสดง — ใช้เป็นเส้นอ้างอิง ไม่ใช่เป้าหมายที่ตั้งไว้ (ยังไม่มีระบบตั้งเป้าหมาย) */
  averageMinutes: number;
  rangeLabel: string;
}

export function computeDailyMinutes(
  sessions: SessionInput[],
  days = 14,
  now = Date.now(),
): DailyMinutesResult {
  const keys = lastNDayKeys(days, now);
  const byDay = new Map<string, number>();
  for (const s of sessions) {
    const key = bangkokDateKey(s.startedAt);
    if (!keys.includes(key)) continue;
    byDay.set(key, (byDay.get(key) ?? 0) + s.minutes);
  }

  const totalMinutes = [...byDay.values()].reduce((a, b) => a + b, 0);
  if (totalMinutes === 0) {
    return {
      ready: false,
      message: `ยังไม่มีเวลาเรียนที่บันทึกไว้ใน ${days} วันล่าสุด — อ่านบทหรือฝึกโจทย์อย่างน้อย 1 นาทีก่อนถึงจะเห็นกราฟนี้`,
      points: [],
      averageMinutes: 0,
      rangeLabel: rangeLabel(days, now),
    };
  }

  const points = keys.map((key) => ({
    date: key,
    label: bangkokDateLabel(keyToBangkokMidnight(key)),
    minutes: byDay.get(key) ?? 0,
  }));

  return {
    ready: true,
    points,
    averageMinutes: Math.round(totalMinutes / days),
    rangeLabel: rangeLabel(days, now),
  };
}

// ---------- 3. จำนวนบทที่เรียนจบสะสมตามเวลา ----------

export interface CumulativeLessonsPoint {
  at: number;
  label: string;
  count: number;
}

export interface CumulativeLessonsResult {
  ready: boolean;
  message?: string;
  points: CumulativeLessonsPoint[];
}

export function computeCumulativeCompletedLessons(
  progress: LessonProgressInput[],
): CumulativeLessonsResult {
  const completedAts = progress
    .map((p) => p.completedAt)
    .filter((t): t is number => typeof t === "number")
    .sort((a, b) => a - b);

  if (completedAts.length === 0) {
    return {
      ready: false,
      message: "ยังไม่มีบทที่ทำเครื่องหมายว่าเรียนจบเลย — เรียนจบอย่างน้อย 1 บทถึงจะเห็นกราฟนี้",
      points: [],
    };
  }

  const points = completedAts.map((at, i) => ({
    at,
    label: bangkokDateLabel(at),
    count: i + 1,
  }));

  return { ready: true, points };
}

// ---------- 4. ความแม่นยำรายหัวข้อ ----------

export interface TopicAccuracyRow {
  topicId: string;
  title: string;
  correct: number;
  total: number;
  pct: number;
  /** slug ของบทที่อ่อนที่สุดในหัวข้อนี้ — ใช้ทำปุ่มพาไปฝึกต่อ */
  worstLessonSlug: string;
}

export interface TopicAccuracyResult {
  ready: boolean;
  message?: string;
  rows: TopicAccuracyRow[];
}

export interface TopicIndexEntry {
  slug: string;
  topicId: string;
  topicTitle: string;
}

/**
 * รับดัชนีบทเรียนแบบเบา (slug/topicId/ชื่อหัวข้อ) เป็นพารามิเตอร์ แทนการ import เนื้อหาบทเรียนเต็ม
 * จาก @/content ตรง ๆ — ไฟล์นี้ถูกเรียกจาก client component ถ้า import เนื้อหาเต็มจะพ่วง
 * เนื้อหาทั้งหมด (KaTeX ที่ render แล้ว ฯลฯ) เข้าไปใน client bundle โดยไม่จำเป็น
 */
export function computeTopicAccuracy(
  attempts: AttemptInput[],
  topicIndex: TopicIndexEntry[],
): TopicAccuracyResult {
  const totalAttempts = attempts.length;
  if (totalAttempts < MIN_TOPIC_ATTEMPTS) {
    return {
      ready: false,
      message: `ทำโจทย์ไปแล้ว ${totalAttempts} ข้อ — ทำเพิ่มอีกอย่างน้อย ${
        MIN_TOPIC_ATTEMPTS - totalAttempts
      } ข้อถึงจะเห็นกราฟนี้`,
      rows: [],
    };
  }

  // attempts.lessonId เก็บ "slug" ของบทเรียน (ไม่ใช่ lesson.id) — ต้องมองผ่าน slug เท่านั้น
  const entryBySlug = new Map(topicIndex.map((e) => [e.slug, e]));

  const byLesson = new Map<string, { correct: number; total: number }>();
  for (const a of attempts) {
    const cur = byLesson.get(a.lessonId) ?? { correct: 0, total: 0 };
    cur.total++;
    if (a.isCorrect) cur.correct++;
    byLesson.set(a.lessonId, cur);
  }

  const byTopic = new Map<
    string,
    {
      title: string;
      correct: number;
      total: number;
      lessons: Array<{ slug: string; correct: number; total: number }>;
    }
  >();
  for (const [slug, v] of byLesson) {
    const entry = entryBySlug.get(slug);
    if (!entry) continue;
    const cur = byTopic.get(entry.topicId) ?? {
      title: entry.topicTitle,
      correct: 0,
      total: 0,
      lessons: [],
    };
    cur.correct += v.correct;
    cur.total += v.total;
    cur.lessons.push({ slug, correct: v.correct, total: v.total });
    byTopic.set(entry.topicId, cur);
  }

  const rows: TopicAccuracyRow[] = [...byTopic.entries()]
    .map(([topicId, v]) => {
      const worst = v.lessons
        .slice()
        .sort((a, b) => a.correct / a.total - b.correct / b.total)[0]!;
      return {
        topicId,
        title: v.title || topicId,
        correct: v.correct,
        total: v.total,
        pct: Math.round((v.correct / v.total) * 100),
        worstLessonSlug: worst.slug,
      };
    })
    .sort((a, b) => a.pct - b.pct);

  return { ready: true, rows };
}

// ---------- 5. คะแนนข้อสอบจำลองตามเวลา ----------

export interface ExamScorePoint {
  at: number;
  label: string;
  pct: number;
  score: number;
  maxScore: number;
}

export interface ExamScoreResult {
  ready: boolean;
  message?: string;
  points: ExamScorePoint[];
}

export function computeExamScoreSeries(results: ExamResultInput[]): ExamScoreResult {
  if (results.length === 0) {
    return {
      ready: false,
      message: "ยังไม่เคยทำข้อสอบจำลองจนจบเลย — ทำอย่างน้อย 1 ชุดถึงจะเห็นกราฟนี้",
      points: [],
    };
  }

  const points = results
    .slice()
    .sort((a, b) => a.takenAt - b.takenAt)
    .map((r) => ({
      at: r.takenAt,
      label: bangkokDateLabel(r.takenAt),
      pct: Math.round((r.score / r.maxScore) * 100),
      score: r.score,
      maxScore: r.maxScore,
    }));

  return { ready: true, points };
}

// ---------- 6. ความสม่ำเสมอ 12 สัปดาห์ (heatmap รายวัน) ----------

export interface HeatmapDay {
  date: string;
  label: string;
  minutes: number;
}

export interface HeatmapResult {
  ready: boolean;
  message?: string;
  /** เรียงเก่าไปใหม่ ยาว weeks*7 วัน แบ่งเป็นสัปดาห์ละ 7 ช่องให้ส่วนแสดงผลจัดกริดเอง */
  days: HeatmapDay[];
  rangeLabel: string;
}

export function computeWeeklyHeatmap(
  sessions: SessionInput[],
  weeks = 12,
  now = Date.now(),
): HeatmapResult {
  const totalDays = weeks * 7;
  const keys = lastNDayKeys(totalDays, now);
  const byDay = new Map<string, number>();
  for (const s of sessions) {
    const key = bangkokDateKey(s.startedAt);
    if (!keys.includes(key)) continue;
    byDay.set(key, (byDay.get(key) ?? 0) + s.minutes);
  }

  const totalMinutes = [...byDay.values()].reduce((a, b) => a + b, 0);
  if (totalMinutes === 0) {
    return {
      ready: false,
      message: `ยังไม่มีเวลาเรียนที่บันทึกไว้ใน ${weeks} สัปดาห์ล่าสุด — เริ่มอ่านบทหรือฝึกโจทย์ก่อนถึงจะเห็นกราฟนี้`,
      days: [],
      rangeLabel: rangeLabel(totalDays, now),
    };
  }

  const days = keys.map((key) => ({
    date: key,
    label: bangkokDateLabel(keyToBangkokMidnight(key)),
    minutes: byDay.get(key) ?? 0,
  }));

  return { ready: true, days, rangeLabel: rangeLabel(totalDays, now) };
}
