const DAY_MS = 24 * 60 * 60 * 1000;

/** คีย์วันที่ YYYY-MM-DD ตามเขตเวลา Asia/Bangkok — ใช้จัดกลุ่มเหตุการณ์เป็นรายวัน */
export function bangkokDateKey(ms: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));
}

/** ป้ายวันที่แบบอ่านง่าย เช่น "12 ก.ย." — ใช้แสดงบนกราฟ */
export function bangkokDateLabel(ms: number): string {
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "short",
  }).format(new Date(ms));
}

/** แปลงคีย์ YYYY-MM-DD กลับเป็นเวลาเที่ยงคืนของวันนั้นตามเขตเวลา Asia/Bangkok
 * ระบุ offset +07:00 ตรง ๆ เสมอ ไม่สร้าง Date จากสตริงวันที่เปล่า ๆ (กันวันเพี้ยน) */
export function keyToBangkokMidnight(key: string): number {
  return new Date(`${key}T00:00:00+07:00`).getTime();
}

/** รายการคีย์วันที่ของ N วันล่าสุด (รวมวันนี้) เรียงเก่าไปใหม่ */
export function lastNDayKeys(days: number, now: number): string[] {
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i--) out.push(bangkokDateKey(now - i * DAY_MS));
  return out;
}

/** ช่วงวันที่แบบอ่านง่ายกำกับกราฟ เช่น "14 ส.ค. – 12 ก.ย." */
export function rangeLabel(days: number, now: number): string {
  const keys = lastNDayKeys(days, now);
  const first = keyToBangkokMidnight(keys[0]!);
  return `${bangkokDateLabel(first)} – ${bangkokDateLabel(now)}`;
}

/** วันในสัปดาห์ตามเขตเวลา Asia/Bangkok (0 = อาทิตย์ .. 6 = เสาร์) — ไทยไม่มี DST จึงเลื่อน +7 ชม.
 * แล้วอ่านค่าแบบ UTC ได้ตรง ๆ โดยไม่ต้องพึ่ง Intl ซึ่งช้ากว่าเมื่อเรียกบ่อย ๆ ในลูป */
export function bangkokWeekday(ms: number): number {
  return new Date(ms + 7 * 60 * 60 * 1000).getUTCDay();
}

export { DAY_MS };
