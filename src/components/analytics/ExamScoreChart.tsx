"use client";

import { useVizTheme } from "@/components/viz/core/theme";
import type { ExamScoreResult } from "@/lib/analytics/compute";
import { ChartCard, ChartEmptyState } from "./ChartShell";

const HEIGHT = 200;
const MARGIN = { top: 12, right: 16, bottom: 24, left: 34 };
const TICKS = [0, 25, 50, 75, 100];

export function ExamScoreChart({ data }: { data: ExamScoreResult }) {
  const theme = useVizTheme();

  if (!data.ready) {
    return (
      <ChartCard title="คะแนนข้อสอบจำลองตามเวลา" caption="ทุกครั้งที่ทำข้อสอบจำลองจนจบ">
        <ChartEmptyState message={data.message!} />
      </ChartCard>
    );
  }

  const width = Math.max(560, data.points.length * 60 + MARGIN.left + MARGIN.right);
  const plotW = width - MARGIN.left - MARGIN.right;
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;
  const n = data.points.length;
  const x = (i: number) => MARGIN.left + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const y = (pct: number) => MARGIN.top + (1 - pct / 100) * plotH;

  const path = data.points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.pct)}`).join(" ");

  return (
    <ChartCard
      title="คะแนนข้อสอบจำลองตามเวลา"
      caption={`% คะแนนแต่ละครั้งที่ทำจนจบ · ${data.points.length} ครั้ง`}
    >
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label={`คะแนนข้อสอบจำลอง ${data.points.map((p) => `${p.label} ${p.pct}%`).join(", ")}`}
      >
        {TICKS.map((t) => (
          <g key={t}>
            <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(t)} y2={y(t)} stroke={t === 0 ? theme.gridMajor : theme.grid} strokeWidth={1} />
            <text x={MARGIN.left - 6} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill={theme.label}>
              {t}%
            </text>
          </g>
        ))}

        <path d={path} fill="none" stroke={theme.curve} strokeWidth={2.25} strokeLinejoin="round" strokeLinecap="round" />
        {data.points.map((p, i) => (
          <circle key={p.at} cx={x(i)} cy={y(p.pct)} r={4} fill={theme.point} />
        ))}

        {data.points.map((p, i) => (
          <text key={`label-${p.at}`} x={x(i)} y={HEIGHT - 6} textAnchor="middle" fontSize={10.5} fill={theme.label}>
            {p.label}
          </text>
        ))}
      </svg>
    </ChartCard>
  );
}
