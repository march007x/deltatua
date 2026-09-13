"use client";

import { useVizTheme } from "@/components/viz/core/theme";
import type { TopicAccuracyResult } from "@/lib/analytics/compute";
import { ChartCard, ChartEmptyState } from "./ChartShell";
import { LinkButton } from "@/components/ui/Button";

const ROW_HEIGHT = 30;
const MARGIN = { top: 8, right: 44, bottom: 8, left: 8 };

export function TopicAccuracyChart({ data }: { data: TopicAccuracyResult }) {
  const theme = useVizTheme();

  if (!data.ready) {
    return (
      <ChartCard title="ความแม่นยำรายหัวข้อ" caption="เรียงจากอ่อนสุดขึ้นมา">
        <ChartEmptyState message={data.message!} />
      </ChartCard>
    );
  }

  const width = 560;
  const labelW = 168;
  const barAreaW = width - labelW - MARGIN.left - MARGIN.right;
  const height = data.rows.length * ROW_HEIGHT + MARGIN.top + MARGIN.bottom;
  const weakest = data.rows[0]!;

  return (
    <ChartCard title="ความแม่นยำรายหัวข้อ" caption="เรียงจากอ่อนสุดขึ้นมา — คำนวณสดจากทุกครั้งที่ตอบโจทย์">
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={`ความแม่นยำรายหัวข้อ ${data.rows.map((r) => `${r.title} ${r.pct}%`).join(", ")}`}
      >
        {data.rows.map((r, i) => {
          const y = MARGIN.top + i * ROW_HEIGHT;
          const barW = (r.pct / 100) * barAreaW;
          const weak = r.pct < 70;
          return (
            <g key={r.topicId}>
              <text x={labelW} y={y + ROW_HEIGHT / 2 - 2} textAnchor="end" fontSize={12} fill={theme.label}>
                <title>{r.title}</title>
                {r.title.length > 22 ? `${r.title.slice(0, 21)}…` : r.title}
              </text>
              <rect
                x={labelW + MARGIN.left}
                y={y + 4}
                width={barAreaW}
                height={ROW_HEIGHT - 12}
                fill={theme.grid}
                rx={3}
              />
              <rect
                x={labelW + MARGIN.left}
                y={y + 4}
                width={Math.max(2, barW)}
                height={ROW_HEIGHT - 12}
                fill={weak ? "var(--danger)" : theme.curve}
                rx={3}
              />
              <text
                x={labelW + MARGIN.left + barAreaW + 6}
                y={y + ROW_HEIGHT / 2 - 2}
                fontSize={12}
                fill={theme.label}
              >
                {r.pct}% ({r.correct}/{r.total})
              </text>
            </g>
          );
        })}
      </svg>

      {weakest.pct < 70 ? (
        <div className="mt-2 px-1">
          <LinkButton href={`/practice/${weakest.worstLessonSlug}`} variant="primary">
            ไปฝึกหัวข้อที่อ่อนที่สุด: {weakest.title}
          </LinkButton>
        </div>
      ) : null}
    </ChartCard>
  );
}
