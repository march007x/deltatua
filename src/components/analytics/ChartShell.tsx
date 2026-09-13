import { cx } from "@/lib/utils";

/** กรอบมาตรฐานของกราฟพัฒนาการ — เลียนแบบสไตล์ VizFrame ที่ใช้ในบทเรียน (การ์ดขอบเส้น + หัวเรื่อง + คำอธิบาย) */
export function ChartCard({
  title,
  caption,
  children,
  className,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <figure className={cx("overflow-hidden rounded-lg border border-line bg-surface", className)}>
      <figcaption className="border-b border-line px-4 py-2.5">
        <p className="m-0 font-display text-[14.5px] font-semibold text-ink">{title}</p>
        {caption ? <p className="m-0 text-[13px] leading-snug text-ink-3">{caption}</p> : null}
      </figcaption>
      {/* เลื่อนแนวนอนในกล่องตัวเอง — หน้าเว็บทั้งหน้าต้องไม่เลื่อนออกด้านข้างเพราะกราฟนี้ */}
      <div className="overflow-x-auto p-3">{children}</div>
    </figure>
  );
}

/** ข้อความบอกว่าข้อมูลยังไม่พอ พร้อมบอกว่าต้องทำอะไรอีกเท่าไร — ห้ามวาดกราฟศูนย์ให้ดูเหมือนมีข้อมูล */
export function ChartEmptyState({ message }: { message: string }) {
  return (
    <p className="m-0 rounded-lg border border-dashed border-line-strong bg-surface-2 px-4 py-8 text-center text-[14px] leading-relaxed text-ink-3">
      {message}
    </p>
  );
}
