"use client";

import { niceStep } from "@/components/viz/core/viewport";
import { useVizTheme } from "@/components/viz/core/theme";
import { bangkokDateLabel } from "@/lib/analytics/dates";
import type { CumulativeLessonsResult } from "@/lib/analytics/compute";
import { ChartCard, ChartEmptyState } from "./ChartShell";

const HEIGHT = 200;
const MARGIN = { top: 12, right: 16, bottom: 24, left: 34 };

export function CumulativeLessonsChart({ data }: { data: CumulativeLessonsResult }) {
  const theme = useVizTheme();

  if (!data.ready) {
    return (
      <ChartCard title="บทที่เรียนจบสะสม" caption="ตามเวลาจริงที่ทำเครื่องหมายว่าเรียนจบ">
        <ChartEmptyState message={data.message!} />
      </ChartCard>
    );
  }

  const now = Date.now();
  const first = data.points[0]!.at;
  const last = data.points[data.points.length - 1]!;
  const xMax = Math.max(now, last.at);
  const maxCount = last.count;
  const step = niceStep(maxCount, 4) || 1;
  const axisMax = Math.max(step, Math.ceil(maxCount / step) * step);
  const ticks: number[] = [];
  for (let t = 0; t <= axisMax; t += step) ticks.push(t);

  const width = Math.max(560, data.points.length * 20 + MARGIN.left + MARGIN.right);
  const plotW = width - MARGIN.left - MARGIN.right;
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;
  const span = Math.max(xMax - first, 1);
  const x = (at: number) => MARGIN.left + ((at - first) / span) * plotW;
  const y = (count: number) => MARGIN.top + (1 - count / axisMax) * plotH;

  // เส้นขั้นบันได: แต่ละบทที่จบทำให้เส้นขยับขึ้นทันที แล้วคงระดับไว้จนบทถัดไป
  let stepPath = `M${x(first)},${y(0)}`;
  for (const p of data.points) {
    stepPath += ` L${x(p.at)},${y(p.count)}`;
  }
  stepPath += ` L${x(xMax)},${y(maxCount)}`;

  return (
    <ChartCard
      title="บทที่เรียนจบสะสม"
      caption={`${bangkokDateLabel(first)} – ${bangkokDateLabel(now)} · รวม ${maxCount} บท`}
    >
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label={`บทที่เรียนจบสะสม ${maxCount} บท ตั้งแต่ ${bangkokDateLabel(first)} ถึง ${bangkokDateLabel(now)}`}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(t)} y2={y(t)} stroke={t === 0 ? theme.gridMajor : theme.grid} strokeWidth={1} />
            <text x={MARGIN.left - 6} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill={theme.label}>
              {t}
            </text>
          </g>
        ))}

        <path d={stepPath} fill="none" stroke={theme.curve} strokeWidth={2.25} strokeLinejoin="round" />
        {data.points.map((p) => (
          <circle key={p.at} cx={x(p.at)} cy={y(p.count)} r={3.5} fill={theme.point} />
        ))}

        <text x={MARGIN.left} y={HEIGHT - 6} textAnchor="start" fontSize={10.5} fill={theme.label}>
          {bangkokDateLabel(first)}
        </text>
        <text x={width - MARGIN.right} y={HEIGHT - 6} textAnchor="end" fontSize={10.5} fill={theme.label}>
          {bangkokDateLabel(now)}
        </text>
      </svg>
    </ChartCard>
  );
}
