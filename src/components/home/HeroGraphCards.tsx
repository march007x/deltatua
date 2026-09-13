/**
 * แถบการ์ดที่ขอบล่างของหน้าจอแรก — ภาพนิ่งของกราฟโต้ตอบที่มีอยู่แล้วในโปรเจกต์ (พาราโบลา,
 * วงกลมหนึ่งหน่วย, แผนภาพเวนน์, เส้นสัมผัสอนุพันธ์, กราฟตรีโกณ) วาดเป็น SVG นิ่งเอง
 * ไม่ใช้ canvas ของ viz/core เพราะอันนั้นวาดผ่าน <canvas> ซึ่งไม่มีทาง "แช่แข็ง" เป็น SVG ตรง ๆ
 *
 * ไม่มี state หรือ JS ใด ๆ เลย — สีทั้งหมดอ้าง CSS variable ของธีมตรง ๆ ผ่าน SVG presentation
 * attribute (เบราว์เซอร์ปัจจุบันรองรับ var() ในนั้นอยู่แล้ว) จึงสลับสีตามธีมสว่าง/มืดได้เองโดยไม่ต้อง
 * มี client component มาคอยอ่านค่าเหมือน viz ที่โต้ตอบได้
 */

const CURVE = "var(--viz-curve)";
const GRID = "var(--viz-grid)";
const AXIS = "var(--viz-axis)";
const POINT = "var(--viz-point)";
const DELTA = "var(--viz-delta)";

function CardFrame({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 140 140" className="h-full w-full" aria-hidden="true">
      <rect x="0.5" y="0.5" width="139" height="139" rx="14" fill="var(--viz-bg)" stroke={GRID} />
      {children}
    </svg>
  );
}

function ParabolaCard() {
  return (
    <CardFrame>
      <line x1="20" y1="70" x2="120" y2="70" stroke={AXIS} strokeWidth="1" />
      <line x1="70" y1="20" x2="70" y2="120" stroke={AXIS} strokeWidth="1" />
      <path d="M 30 115 Q 70 15 110 115" fill="none" stroke={CURVE} strokeWidth="3" strokeLinecap="round" />
    </CardFrame>
  );
}

function UnitCircleCard() {
  return (
    <CardFrame>
      <line x1="15" y1="70" x2="125" y2="70" stroke={AXIS} strokeWidth="1" />
      <line x1="70" y1="15" x2="70" y2="125" stroke={AXIS} strokeWidth="1" />
      <circle cx="70" cy="70" r="46" fill="none" stroke={GRID} strokeWidth="1.5" />
      <line x1="70" y1="70" x2="103" y2="42" stroke={CURVE} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="103" y1="70" x2="103" y2="42" stroke={DELTA} strokeWidth="2" strokeDasharray="3 3" />
      <line x1="70" y1="70" x2="103" y2="70" stroke={DELTA} strokeWidth="2" strokeDasharray="3 3" />
      <circle cx="103" cy="42" r="3.5" fill={POINT} />
    </CardFrame>
  );
}

function VennCard() {
  return (
    <CardFrame>
      <circle cx="56" cy="70" r="36" fill="none" stroke={CURVE} strokeWidth="2.5" />
      <circle cx="84" cy="70" r="36" fill="none" stroke={DELTA} strokeWidth="2.5" />
    </CardFrame>
  );
}

function TangentCard() {
  return (
    <CardFrame>
      <line x1="20" y1="115" x2="120" y2="115" stroke={AXIS} strokeWidth="1" />
      <path d="M 25 105 C 55 115, 75 40, 115 35" fill="none" stroke={CURVE} strokeWidth="3" strokeLinecap="round" />
      <line x1="45" y1="98" x2="105" y2="58" stroke={DELTA} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="75" cy="78" r="4" fill={POINT} />
    </CardFrame>
  );
}

function TrigCard() {
  return (
    <CardFrame>
      <line x1="15" y1="70" x2="125" y2="70" stroke={AXIS} strokeWidth="1" />
      <path
        d="M 15 70 C 28 30, 42 30, 55 70 C 68 110, 82 110, 95 70 C 102 50, 109 50, 115 70"
        fill="none"
        stroke={CURVE}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </CardFrame>
  );
}

const CARDS = [
  { Card: VennCard, rotate: -6, hideOnMobile: true },
  { Card: TangentCard, rotate: 3, hideOnMobile: false },
  { Card: ParabolaCard, rotate: 0, hideOnMobile: false },
  { Card: UnitCircleCard, rotate: -3, hideOnMobile: false },
  { Card: TrigCard, rotate: 6, hideOnMobile: true },
];

export function HeroGraphCards() {
  return (
    // overflow-hidden ตรงนี้กันไม่ให้หน้าเว็บเลื่อนแนวนอน ส่วนแถบการ์ดข้างในกว้างกว่าจอตั้งใจ
    // เพื่อให้ใบซ้ายสุด/ขวาสุดโดนตัดขอบพอดี (เอฟเฟกต์ "ล้นออกนอกจอ")
    <div className="relative overflow-hidden py-6 sm:py-12">
      <div className="mx-auto flex w-fit items-center justify-center">
        {CARDS.map(({ Card, rotate, hideOnMobile }, i) => (
          <div
            key={i}
            style={{ transform: `rotate(${rotate}deg)`, marginLeft: i === 0 ? 0 : "-22px" }}
            className={
              "h-[150px] w-[150px] shrink-0 drop-shadow-xl sm:h-[170px] sm:w-[170px] " +
              (hideOnMobile ? "hidden sm:block" : "")
            }
          >
            <Card />
          </div>
        ))}
      </div>
    </div>
  );
}
