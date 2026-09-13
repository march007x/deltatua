// ทดสอบตรง ๆ ว่าฟังก์ชันคำนวณ "วันนี้" ใช้ Asia/Bangkok เสมอ ไม่สนใจ timezone ของเครื่องที่รัน
// จำลองเวลาให้คร่อมเที่ยงคืนเวลากรุงเทพ (เที่ยงคืนกรุงเทพ = 17:00 UTC ของวันก่อนหน้า)
function bangkokToday(ms) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date(ms));
}

const beforeMidnight = Date.parse("2026-09-13T16:59:00Z"); // 23:59 น. 13 ก.ย. เวลากรุงเทพ
const afterMidnight = Date.parse("2026-09-13T17:01:00Z"); // 00:01 น. 14 ก.ย. เวลากรุงเทพ

console.log("UTC instant 16:59Z (=23:59 Bangkok, 13 Sep)  -> bangkokToday:", bangkokToday(beforeMidnight));
console.log("UTC instant 17:01Z (=00:01 Bangkok, 14 Sep)  -> bangkokToday:", bangkokToday(afterMidnight));
console.log(
  "Correct rollover:",
  bangkokToday(beforeMidnight) === "2026-09-13" && bangkokToday(afterMidnight) === "2026-09-14"
    ? "PASS"
    : "FAIL",
);

// เทียบกับถ้าใช้ local timezone เฉย ๆ (ไม่ระบุ timeZone) จะพลาดถ้าเครื่องรันไม่ได้อยู่ Bangkok
function localToday(ms) {
  return new Intl.DateTimeFormat("en-CA").format(new Date(ms)); // ไม่ระบุ timeZone = ใช้ของเครื่อง
}
console.log("\n(สำหรับเทียบ) ถ้าไม่ระบุ timeZone เลย จะได้ตามเครื่องที่รันโค้ดนี้ (env TZ):", process.env.TZ ?? "(ระบบ default)");
console.log("localToday(16:59Z):", localToday(beforeMidnight), " localToday(17:01Z):", localToday(afterMidnight));
