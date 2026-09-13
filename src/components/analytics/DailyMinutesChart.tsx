"use client";

import { niceStep } from "@/components/viz/core/viewport";
import { useVizTheme } from "@/components/viz/core/theme";
import type { DailyMinutesResult } from "@/lib/analytics/compute";
import { ChartCard, ChartEmptyState } from "./ChartShell";

const HEIGHT = 200;
const MARGIN = { top: 12, right: 16, bottom: 24, left: 34 };

export function DailyMinutesChart({ data, days }: { data: DailyMinutesResult; days: number }) {
  const theme = useVizTheme();

  if (!data.ready) {
    return (
      <ChartCard title="นาทีที่เรียนจริงต่อวัน" caption={`${days} วันล่าสุด · ${data.rangeLabel}`}>
        <ChartEmptyState message={data.message!} />
      </ChartCard>
    );
  }

  const maxMinutes = Math.max(...data.points.map((p) => p.minutes), 1);
  const step = niceStep(maxMinutes, 4);
  const axisMax = Math.ceil(maxMinutes / step) * step;
  const ticks: number[] = [];
  for (let t = 0; t <= axisMax; t += step) ticks.push(t);

  const width = Math.max(560, data.points.length * 30 + MARGIN.left + MARGIN.right);
  const plotW = width - MARGIN.left - MARGIN.right;
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;
  const barW = Math.min(22, (plotW / data.points.length) * 0.6);
  const xCenter = (i: number) => MARGIN.left + ((i + 0.5) / data.points.length) * plotW;
  const y = (minutes: number) => MARGIN.top + (1 - minutes / axisMax) * plotH;

  return (
    <ChartCard
      title="นาทีที่เรียนจริงต่อวัน"
      caption={`นาที (เฉพาะเวลาที่มีการกระทำจริง) · ${days} วันล่าสุด · ${data.rangeLabel} · เฉลี่ยวันละ ${data.averageMinutes} นาที`}
    >
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label={`กราฟนาทีที่เรียนต่อวัน ${data.points.map((p) => `${p.label} ${p.minutes} นาที`).join(", ")}`}
      >
        {ticks.map((t) => (
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
              {t}
            </text>
          </g>
        ))}

        {/* เส้นค่าเฉลี่ยของช่วงที่แสดง — เป็นค่าที่คำนวณจากข้อมูลจริง ไม่ใช่เป้าหมายที่ตั้งไว้ (ยังไม่มีระบบตั้งเป้าหมาย) */}
        <line
          x1={MARGIN.left}
          x2={width - MARGIN.right}
          y1={y(data.averageMinutes)}
          y2={y(data.averageMinutes)}
          stroke={theme.delta}
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />

        {data.points.map((p, i) => (
          <rect
            key={p.date}
            x={xCenter(i) - barW / 2}
            y={y(p.minutes)}
            width={barW}
            height={Math.max(0, y(0) - y(p.minutes))}
            fill={theme.curve}
            rx={2}
          />
        ))}

        {data.points.map((p, i) => (
          <text key={`label-${p.date}`} x={xCenter(i)} y={HEIGHT - 6} textAnchor="middle" fontSize={10} fill={theme.label}>
            {p.label}
          </text>
        ))}
      </svg>
    </ChartCard>
  );
}
