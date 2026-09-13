import { test } from "node:test";
import assert from "node:assert/strict";
import { computePracticeMap, needsReview } from "./practice";
import type { AttemptRecord } from "@/lib/events/attempts";

function makeAttempt(partial: Partial<AttemptRecord> & { id: string }): AttemptRecord {
  return {
    questionId: "q",
    lessonId: "set-basic",
    isCorrect: true,
    seconds: 10,
    createdAt: Date.now(),
    ...partial,
  };
}

test("จัดกลุ่มเป็นรอบเดียวเมื่อตอบต่อเนื่องกันไม่เกิน 20 นาที", () => {
  const now = Date.now();
  const attempts: AttemptRecord[] = [
    makeAttempt({ id: "a1", questionId: "q1", isCorrect: true, createdAt: now - 3 * 60_000 }),
    makeAttempt({ id: "a2", questionId: "q2", isCorrect: false, createdAt: now - 2 * 60_000 }),
    makeAttempt({ id: "a3", questionId: "q3", isCorrect: true, createdAt: now }),
  ];
  const map = computePracticeMap(attempts);
  assert.deepEqual(map["set-basic"], {
    correct: 2,
    total: 3,
    expectedTotal: 3,
    complete: true,
    missed: ["q2"],
    at: now,
  });
});

test("ตัดรอบใหม่เมื่อห่างกันเกิน 20 นาที เอาเฉพาะรอบล่าสุด", () => {
  const now = Date.now();
  const attempts: AttemptRecord[] = [
    // รอบเก่า (ควรถูกตัดทิ้ง)
    makeAttempt({ id: "old1", questionId: "q1", isCorrect: false, createdAt: now - 60 * 60_000 }),
    makeAttempt({ id: "old2", questionId: "q2", isCorrect: false, createdAt: now - 59 * 60_000 }),
    // รอบล่าสุด
    makeAttempt({ id: "new1", questionId: "q1", isCorrect: true, createdAt: now - 60_000 }),
    makeAttempt({ id: "new2", questionId: "q2", isCorrect: true, createdAt: now }),
  ];
  const map = computePracticeMap(attempts);
  assert.equal(map["set-basic"]!.total, 2);
  assert.equal(map["set-basic"]!.correct, 2);
  assert.deepEqual(map["set-basic"]!.missed, []);
});

test("ไม่นับ attempts ที่มาจากข้อสอบจำลอง (มี examId)", () => {
  const now = Date.now();
  const attempts: AttemptRecord[] = [
    makeAttempt({ id: "p1", questionId: "q1", isCorrect: true, createdAt: now }),
    makeAttempt({ id: "e1", questionId: "q1", isCorrect: false, examId: "m4-1", createdAt: now }),
  ];
  const map = computePracticeMap(attempts);
  assert.equal(map["set-basic"]!.total, 1);
  assert.equal(map["set-basic"]!.correct, 1);
});

test("แยกแต่ละบทออกจากกัน", () => {
  const now = Date.now();
  const attempts: AttemptRecord[] = [
    makeAttempt({ id: "a1", lessonId: "set-basic", isCorrect: true, createdAt: now }),
    makeAttempt({ id: "a2", lessonId: "logic-basic", isCorrect: false, createdAt: now }),
  ];
  const map = computePracticeMap(attempts);
  assert.equal(map["set-basic"]!.correct, 1);
  assert.equal(map["logic-basic"]!.correct, 0);
});

test("รอบที่ทำครบตามจำนวนข้อจริงถือว่า complete และตัดสินผ่าน/ไม่ผ่านตามคะแนนตามปกติ", () => {
  const now = Date.now();
  // ชุดฝึกบทนี้มี 10 ข้อ (ตาม totals) และทำมาครบ 10 ข้อพอดี ตอบถูก 8 ข้อ (80% ผ่านเกณฑ์)
  const attempts: AttemptRecord[] = Array.from({ length: 10 }, (_, i) =>
    makeAttempt({
      id: `q${i}`,
      questionId: `q${i}`,
      isCorrect: i < 8,
      createdAt: now - (9 - i) * 60_000,
    }),
  );
  const map = computePracticeMap(attempts, { "set-basic": 10 });
  const r = map["set-basic"]!;
  assert.equal(r.total, 10);
  assert.equal(r.expectedTotal, 10);
  assert.equal(r.complete, true);
  assert.equal(needsReview(r), false);
});

test("รอบที่ทำค้างไว้กลางคันต้องไม่ถูกนับว่าผ่าน แม้ตอบถูกทุกข้อที่ทำมา", () => {
  const now = Date.now();
  // ชุดฝึกบทนี้มี 10 ข้อ แต่ทำไปแค่ 3 ข้อแล้วเลิกทำ (ตอบถูกทั้ง 3 ข้อ = 100% ของที่ทำ)
  const attempts: AttemptRecord[] = [
    makeAttempt({ id: "q0", questionId: "q0", isCorrect: true, createdAt: now - 2 * 60_000 }),
    makeAttempt({ id: "q1", questionId: "q1", isCorrect: true, createdAt: now - 60_000 }),
    makeAttempt({ id: "q2", questionId: "q2", isCorrect: true, createdAt: now }),
  ];
  const map = computePracticeMap(attempts, { "set-basic": 10 });
  const r = map["set-basic"]!;
  assert.equal(r.total, 3);
  assert.equal(r.correct, 3);
  assert.equal(r.expectedTotal, 10);
  assert.equal(r.complete, false);
  // จุดสำคัญ: ทำค้างไว้ต้องไม่มีทางถูกนับว่าผ่าน ต่อให้ตอบถูกทุกข้อที่ทำมาก็ตาม
  assert.equal(needsReview(r), true);
});
