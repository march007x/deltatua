"use client";

import { useVizTheme } from "@/components/viz/core/theme";
import type { DailyAccuracyResult } from "@/lib/analytics/compute";
import { ChartCard, ChartEmptyState } from "./ChartShell";

const HEIGHT = 200;
const MARGIN = { top: 12, right: 16, bottom: 24, left: 34 };
const TICKS = [0, 25, 50, 75, 100];

export function DailyAccuracyChart({ data, days }: { data: DailyAccuracyResult; days: number }) {
  const theme = useVizTheme();

  if (!data.ready) {
    return (
      <ChartCard title="ความแม่นยำรายวัน" caption={`${days} วันล่าสุด · ${data.rangeLabel}`}>
        <ChartEmptyState message={data.message!} />
      </ChartCard>
    );
  }

  const width = Math.max(560, data.points.length * 26 + MARGIN.left + MARGIN.right);
  const plotW = width - MARGIN.left - MARGIN.right;
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;
  const x = (dayIndex: number) => MARGIN.left + (dayIndex / Math.max(days - 1, 1)) * plotW;
  const y = (pct: number) => MARGIN.top + (1 - pct / 100) * plotH;

  const path = data.points.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.dayIndex)},${y(p.pct)}`).join(" ");
  // แสดงป้ายวันใต้จุดไม่เกิน ๆ 8 จุด กันตัวหนังสือทับกันเมื่อมีข้อมูลหลายวัน
  const labelEvery = Math.max(1, Math.ceil(data.points.length / 8));

  return (
    <ChartCard
      title="ความแม่นยำรายวัน"
      caption={`% ข้อที่ตอบถูกต่อวัน · ${days} วันล่าสุด · ${data.rangeLabel}`}
    >
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label={`กราฟความแม่นยำรายวัน ${data.points.map((p) => `${p.label} ${p.pct}%`).join(", ")}`}
      >
        {TICKS.map((t) => (
          <g key={t}>
            <line
              x1={MARGIN.left}
              x2={width - MARGIN.right}
              y1={y(t)}
              y2={y(t)}
              stroke={t === 0 ? theme.gridMajor : theme.grid}
              strokeWidth={1}
            />
            <text x={MARGIN.left - 6} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill={theme.label}>
              {t}%
            </text>
          </g>
        ))}

        <path d={path} fill="none" stroke={theme.curve} strokeWidth={2.25} strokeLinejoin="round" strokeLinecap="round" />
        {data.points.map((p) => (
          <circle key={p.date} cx={x(p.dayIndex)} cy={y(p.pct)} r={3.5} fill={theme.point} />
        ))}

        {data.points.map((p, i) =>
          i % labelEvery === 0 ? (
            <text
              key={`label-${p.date}`}
              x={x(p.dayIndex)}
              y={HEIGHT - 6}
              textAnchor="middle"
              fontSize={10.5}
              fill={theme.label}
            >
              {p.label}
            </text>
          ) : null,
        )}
      </svg>
    </ChartCard>
  );
}
