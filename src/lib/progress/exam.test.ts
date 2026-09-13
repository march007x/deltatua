import { test } from "node:test";
import assert from "node:assert/strict";
import { computeExamMap } from "./exam";
import type { ExamResultRecord } from "@/lib/events/examResults";

function makeResult(partial: Partial<ExamResultRecord> & { id: string }): ExamResultRecord {
  return {
    examId: "m4-1",
    score: 20,
    maxScore: 30,
    seconds: 1000,
    weakTopics: [],
    takenAt: Date.now(),
    ...partial,
  };
}

test("เลือกแถวล่าสุดของแต่ละ examId เมื่อทำหลายครั้ง", () => {
  const now = Date.now();
  const results: ExamResultRecord[] = [
    makeResult({ id: "old", examId: "m4-1", score: 15, maxScore: 30, takenAt: now - 100_000 }),
    makeResult({ id: "new", examId: "m4-1", score: 25, maxScore: 30, takenAt: now }),
  ];
  const map = computeExamMap(results);
  assert.equal(map["m4-1"]!.correct, 25);
  assert.equal(map["m4-1"]!.at, now);
});

test("แยกแต่ละชุดข้อสอบออกจากกัน", () => {
  const now = Date.now();
  const results: ExamResultRecord[] = [
    makeResult({ id: "a", examId: "m4-1", score: 20, takenAt: now }),
    makeResult({ id: "b", examId: "m4-2", score: 10, takenAt: now }),
  ];
  const map = computeExamMap(results);
  assert.equal(map["m4-1"]!.correct, 20);
  assert.equal(map["m4-2"]!.correct, 10);
});

test("แปลงชื่อฟิลด์ถูกต้อง (score to correct, maxScore to total, weakTopics to weakChapters)", () => {
  const now = Date.now();
  const results: ExamResultRecord[] = [
    makeResult({ id: "a", weakTopics: ["เซต", "ตรรกศาสตร์"], seconds: 1234, takenAt: now }),
  ];
  const map = computeExamMap(results);
  assert.deepEqual(map["m4-1"]!.weakChapters, ["เซต", "ตรรกศาสตร์"]);
  assert.equal(map["m4-1"]!.spentSeconds, 1234);
});
