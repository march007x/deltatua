"use client";

import { useVizTheme } from "@/components/viz/core/theme";
import { bangkokWeekday, keyToBangkokMidnight } from "@/lib/analytics/dates";
import type { HeatmapResult } from "@/lib/analytics/compute";
import { ChartCard, ChartEmptyState } from "./ChartShell";

const CELL = 15;
const GAP = 3;
const WEEKDAY_LABEL = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

export function WeeklyHeatmap({ data }: { data: HeatmapResult }) {
  const theme = useVizTheme();

  if (!data.ready) {
    return (
      <ChartCard title="ความสม่ำเสมอ 12 สัปดาห์" caption={data.rangeLabel}>
        <ChartEmptyState message={data.message!} />
      </ChartCard>
    );
  }

  const firstWeekday = bangkokWeekday(keyToBangkokMidnight(data.days[0]!.date));
  const cells: Array<{ day: (typeof data.days)[number] | null }> = [
    ...Array.from({ length: firstWeekday }, () => ({ day: null })),
    ...data.days.map((day) => ({ day })),
  ];
  const cols = Math.ceil(cells.length / 7);
  const maxMinutes = Math.max(...data.days.map((d) => d.minutes), 1);

  const marginLeft = 26;
  const marginTop = 14;
  const width = marginLeft + cols * (CELL + GAP);
  const height = marginTop + 7 * (CELL + GAP);

  function opacityFor(minutes: number): number {
    if (minutes === 0) return 0;
    return 0.25 + 0.75 * Math.min(1, minutes / maxMinutes);
  }

  return (
    <ChartCard
      title="ความสม่ำเสมอ 12 สัปดาห์"
      caption={`เข้มขึ้นตามนาทีที่เรียนจริงในวันนั้น · ${data.rangeLabel}`}
    >
      <svg width={width} height={height} role="img" aria-label="ฮีตแมปความสม่ำเสมอในการเรียนรายวัน 12 สัปดาห์ล่าสุด">
        {WEEKDAY_LABEL.map((label, row) =>
          row % 2 === 1 ? (
            <text
              key={label}
              x={marginLeft - 4}
              y={marginTop + row * (CELL + GAP) + CELL / 2 + 3}
              textAnchor="end"
              fontSize={9.5}
              fill={theme.label}
            >
              {label}
            </text>
          ) : null,
        )}

        {cells.map((cell, i) => {
          if (!cell.day) return null;
          const col = Math.floor(i / 7);
          const row = i % 7;
          const cx = marginLeft + col * (CELL + GAP);
          const cy = marginTop + row * (CELL + GAP);
          const op = opacityFor(cell.day.minutes);
          return (
            <rect
              key={cell.day.date}
              x={cx}
              y={cy}
              width={CELL}
              height={CELL}
              rx={3}
              fill={op === 0 ? theme.grid : theme.curve}
              opacity={op === 0 ? 1 : op}
            >
              <title>
                {cell.day.label} · {cell.day.minutes} นาที
              </title>
            </rect>
          );
        })}
      </svg>
    </ChartCard>
  );
}
