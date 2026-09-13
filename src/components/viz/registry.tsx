"use client";

import { InteractiveQuadratic } from "./InteractiveQuadratic";
import { InteractiveGraph } from "./InteractiveGraph";
import { InteractiveDerivative } from "./InteractiveDerivative";
import { InteractiveUnitCircle } from "./InteractiveUnitCircle";
import { InteractiveVenn } from "./InteractiveVenn";
import { InteractiveNumberLine } from "./InteractiveNumberLine";
import { InteractiveTruthTable } from "./InteractiveTruthTable";
import { InteractiveAnalyticGeometry } from "./InteractiveAnalyticGeometry";
import { InteractiveSequence } from "./InteractiveSequence";
import { InteractiveProbability } from "./InteractiveProbability";
import { InteractiveVector } from "./InteractiveVector";
import { InteractiveComplexPlane } from "./InteractiveComplexPlane";
import { InteractiveStatistics } from "./InteractiveStatistics";
import { InteractiveLimit } from "./InteractiveLimit";
import { InteractiveIntegral } from "./InteractiveIntegral";
import { InteractiveExtrema } from "./InteractiveExtrema";
import { InteractiveMatrix } from "./InteractiveMatrix";
import { InteractiveTriangle } from "./InteractiveTriangle";
import { VIZ_KEYS, type VizKey } from "./vizKeys";

/**
 * ทะเบียนภาพประกอบ — บทเรียนอ้างถึงภาพด้วย "componentKey" ที่เก็บอยู่ในข้อมูล
 * ไม่ใช่ด้วยการ import component ตรง ๆ จึงย้ายไปเก็บในฐานข้อมูลภายหลังได้โดยไม่แก้โค้ด
 *
 * รายชื่อ key จริง ๆ อยู่ใน vizKeys.ts (ไฟล์ที่ไม่มี "use client") เพื่อให้โค้ดฝั่งเซิร์ฟเวอร์
 * import แค่รายชื่อไปนับจำนวนได้ โดยไม่ต้องลากคอมโพเนนต์ทั้งหมดข้างบนนี้ติดไปด้วย
 */
export { VIZ_KEYS, type VizKey };

interface VizProps {
  height?: number;
  initial?: Record<string, number>;
  title?: string;
  caption?: string;
}

/**
 * ผูก VIZ_KEYS กับตัวเรนเดอร์จริงด้วย satisfies Record<VizKey, ...> — ถ้าเพิ่ม key ใหม่ใน
 * vizKeys.ts แล้วลืมเติมที่นี่ (หรือสะกด key ผิด) tsc จะฟ้องทันทีตอน build ไม่ใช่แค่ตอนรัน
 * จริงแล้วเจอว่ากราฟหาย ไม่มีทางลืมเติมแล้วตัวเลขบนหน้าแรกเงียบหายไปเฉย ๆ เหมือนของเดิม
 * ที่ใช้ if ไล่เทียบ componentKey: string ซึ่งไม่มีอะไรบังคับว่าต้องครบ
 */
const VIZ_RENDERERS = {
  quadratic: (p) => <InteractiveQuadratic height={p.height} />,
  "graph.linear": (p) => (
    <InteractiveGraph family="linear" height={p.height} initial={p.initial} title={p.title} caption={p.caption} />
  ),
  "graph.vertexForm": (p) => (
    <InteractiveGraph
      family="vertexForm"
      height={p.height}
      initial={p.initial}
      title={p.title}
      caption={p.caption}
    />
  ),
  "graph.absolute": (p) => (
    <InteractiveGraph family="absolute" height={p.height} initial={p.initial} title={p.title} caption={p.caption} />
  ),
  "graph.reciprocal": (p) => (
    <InteractiveGraph
      family="reciprocal"
      height={p.height}
      initial={p.initial}
      title={p.title}
      caption={p.caption}
    />
  ),
  "graph.exponential": (p) => (
    <InteractiveGraph
      family="exponential"
      height={p.height}
      initial={p.initial}
      title={p.title}
      caption={p.caption}
    />
  ),
  "graph.logarithm": (p) => (
    <InteractiveGraph
      family="logarithm"
      height={p.height}
      initial={p.initial}
      title={p.title}
      caption={p.caption}
    />
  ),
  "graph.cubicRoots": (p) => (
    <InteractiveGraph
      family="cubicRoots"
      height={p.height}
      initial={p.initial}
      title={p.title}
      caption={p.caption}
    />
  ),
  "graph.sine": (p) => (
    <InteractiveGraph family="sine" height={p.height} initial={p.initial} title={p.title} caption={p.caption} />
  ),
  derivative: (p) => <InteractiveDerivative height={p.height} />,
  unitCircle: (p) => <InteractiveUnitCircle height={p.height} />,
  venn: (p) => <InteractiveVenn height={p.height} />,
  numberLine: (p) => <InteractiveNumberLine height={p.height} />,
  truthTable: () => <InteractiveTruthTable />,
  analyticGeometry: (p) => <InteractiveAnalyticGeometry height={p.height} />,
  sequence: (p) => <InteractiveSequence height={p.height} />,
  probability: (p) => <InteractiveProbability height={p.height} />,
  vector: (p) => <InteractiveVector height={p.height} />,
  complexPlane: (p) => <InteractiveComplexPlane height={p.height} />,
  statistics: (p) => <InteractiveStatistics height={p.height} />,
  limit: (p) => <InteractiveLimit height={p.height} />,
  integral: (p) => <InteractiveIntegral height={p.height} />,
  extrema: (p) => <InteractiveExtrema height={p.height} />,
  matrix: (p) => <InteractiveMatrix height={p.height} />,
  triangle: (p) => <InteractiveTriangle height={p.height} />,
} satisfies Record<VizKey, (p: VizProps) => React.ReactElement>;

export function VizByKey({
  componentKey,
  config,
}: {
  componentKey: string;
  config?: Record<string, unknown>;
}) {
  const height = typeof config?.height === "number" ? config.height : undefined;
  const initial = (config?.initial as Record<string, number> | undefined) ?? undefined;
  const title = typeof config?.title === "string" ? config.title : undefined;
  const caption = typeof config?.caption === "string" ? config.caption : undefined;

  // componentKey มาจากไฟล์เนื้อหา (string เปล่า ไม่ได้ตรวจกับ VizKey ตอน compile) จึงต้อง cast
  // ตัว object ตอนค้นหา ไม่ใช่ตัว key — ถ้าไม่เจอ renderer ให้ตกไปที่กล่อง fallback ด้านล่าง
  const renderers = VIZ_RENDERERS as Record<string, ((p: VizProps) => React.ReactElement) | undefined>;
  const renderer = renderers[componentKey];
  if (renderer) return renderer({ height, initial, title, caption });

  return (
    <p className="my-4 rounded-lg border border-dashed border-line-strong bg-surface-2 px-4 py-3 text-[14px] text-ink-3">
      ยังไม่มีภาพประกอบสำหรับ <code className="font-mono">{componentKey}</code> — ตรวจว่าสะกด key
      ถูกต้องและลงทะเบียนไว้ใน VIZ_RENDERERS (src/components/viz/registry.tsx) แล้วหรือยัง
    </p>
  );
}
