"use client";

import { useMemo } from "react";
import { useAnalyticsData } from "@/lib/analytics/useAnalyticsData";
import {
  computeCumulativeCompletedLessons,
  computeDailyAccuracy,
  computeDailyMinutes,
  computeExamScoreSeries,
  computeTopicAccuracy,
  computeWeeklyHeatmap,
} from "@/lib/analytics/compute";
import type { TopicIndexEntry } from "@/lib/analytics/compute";
import { DailyAccuracyChart } from "./DailyAccuracyChart";
import { DailyMinutesChart } from "./DailyMinutesChart";
import { CumulativeLessonsChart } from "./CumulativeLessonsChart";
import { TopicAccuracyChart } from "./TopicAccuracyChart";
import { ExamScoreChart } from "./ExamScoreChart";
import { WeeklyHeatmap } from "./WeeklyHeatmap";

const ACCURACY_DAYS = 30;
const MINUTES_DAYS = 14;
const HEATMAP_WEEKS = 12;

/**
 * กราฟพัฒนาการ 6 อัน — คำนวณสดจากเหตุการณ์ดิบทุกครั้งที่เปิดหน้า ไม่มีค่าสรุปเก็บไว้ล่วงหน้า
 * แขก (ไม่ล็อกอิน) เห็นกราฟจากข้อมูลในเบราว์เซอร์นี้ได้เหมือนกัน เพราะ useAnalyticsData อ่าน
 * localStorage เป็นค่าเริ่มต้นอยู่แล้วเมื่อไม่มีบัญชี
 *
 * topicIndex รับมาจาก server component (ไม่ import @/content ตรงนี้) กันเนื้อหาบทเรียนทั้งหมด
 * หลุดเข้าไปใน client bundle โดยไม่จำเป็น
 */
export function ProgressCharts({ topicIndex }: { topicIndex: TopicIndexEntry[] }) {
  const { ready, attempts, sessions, examResults, lessonProgress } = useAnalyticsData();

  const dailyAccuracy = useMemo(() => computeDailyAccuracy(attempts, ACCURACY_DAYS), [attempts]);
  const dailyMinutes = useMemo(
    () => computeDailyMinutes(sessions, MINUTES_DAYS),
    [sessions],
  );
  const cumulativeLessons = useMemo(
    () => computeCumulativeCompletedLessons(Object.values(lessonProgress)),
    [lessonProgress],
  );
  const topicAccuracy = useMemo(
    () => computeTopicAccuracy(attempts, topicIndex),
    [attempts, topicIndex],
  );
  const examScores = useMemo(() => computeExamScoreSeries(examResults), [examResults]);
  const heatmap = useMemo(() => computeWeeklyHeatmap(sessions, HEATMAP_WEEKS), [sessions]);

  if (!ready) {
    return (
      <p className="m-0 rounded-lg border border-dashed border-line-strong bg-surface-2 px-4 py-8 text-center text-[14px] text-ink-3">
        กำลังโหลดข้อมูลกราฟ…
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <DailyAccuracyChart data={dailyAccuracy} days={ACCURACY_DAYS} />
      <DailyMinutesChart data={dailyMinutes} days={MINUTES_DAYS} />
      <CumulativeLessonsChart data={cumulativeLessons} />
      <TopicAccuracyChart data={topicAccuracy} />
      <ExamScoreChart data={examScores} />
      <WeeklyHeatmap data={heatmap} />
    </div>
  );
}
