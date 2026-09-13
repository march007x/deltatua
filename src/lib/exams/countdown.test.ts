import { test } from "node:test";
import assert from "node:assert/strict";
import { nextDeadline } from "./countdown";
import type { ExamSlot } from "@/content/exams";

/** โครงขั้นต่ำของ ExamSlot สำหรับทดสอบ — เติมเฉพาะฟิลด์ที่ nextDeadline() ใช้จริง */
function makeExam(partial: Partial<ExamSlot> & { id: string; examGroup: ExamSlot["examGroup"] }): ExamSlot {
  return {
    examYear: "TCAS70",
    status: "confirmed",
    sourceName: "ทดสอบ",
    sourceUrl: "https://www.mytcas.com/",
    verifiedAt: "2026-09-12",
    crossChecked: [],
    ...partial,
  };
}

test("เลือกวันปิดรับสมัครของแถวอื่นที่ใกล้กว่าวันสอบของแถวแรก", () => {
  const now = new Date("2026-09-13T00:00:00+07:00").getTime();
  const exams: ExamSlot[] = [
    makeExam({
      id: "tpat3-70",
      examGroup: "TPAT3",
      startsOn: "2027-01-30T09:00:00+07:00",
      registrationClosesOn: "2026-11-10T23:59:00+07:00",
    }),
    makeExam({
      id: "tpat1-70",
      examGroup: "TPAT1",
      startsOn: "2027-02-13T08:30:00+07:00",
      registrationClosesOn: "2026-09-20T23:59:00+07:00",
    }),
  ];

  const result = nextDeadline(exams, now);
  assert.ok(result);
  assert.equal(result.exam.id, "tpat1-70");
  assert.equal(result.kind, "registration");
  assert.equal(result.at, new Date("2026-09-20T23:59:00+07:00").getTime());
});

test("คืนค่า null เมื่อทุกวันสอบและวันปิดรับสมัครผ่านไปหมดแล้ว", () => {
  const now = new Date("2027-06-01T00:00:00+07:00").getTime();
  const exams: ExamSlot[] = [
    makeExam({
      id: "tpat3-70",
      examGroup: "TPAT3",
      startsOn: "2027-01-30T09:00:00+07:00",
      registrationClosesOn: "2026-11-10T23:59:00+07:00",
    }),
    makeExam({
      id: "alevel-66-70",
      examGroup: "A-Level",
      subjectName: "ชีววิทยา",
      startsOn: "2027-03-13T08:30:00+07:00",
    }),
  ];

  assert.equal(nextDeadline(exams, now), null);
});

test("แถวที่ไม่มี startsOn/registrationClosesOn เลย (status='waiting') ไม่ถูกนับเป็นเหตุการณ์", () => {
  const now = new Date("2026-09-13T00:00:00+07:00").getTime();
  const exams: ExamSlot[] = [
    makeExam({ id: "waiting-1", examGroup: "TPAT4", status: "waiting" }),
    makeExam({
      id: "tgat-70",
      examGroup: "TGAT",
      startsOn: "2027-01-30T13:00:00+07:00",
      registrationClosesOn: "2026-11-10T23:59:00+07:00",
    }),
  ];

  const result = nextDeadline(exams, now);
  assert.ok(result);
  assert.equal(result.exam.id, "tgat-70");
});
