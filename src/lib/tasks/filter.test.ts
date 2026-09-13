import { test } from "node:test";
import assert from "node:assert/strict";
import { collectSubjects, filterByKind, filterBySubject, subjectsInList } from "./filter";

interface FakeTask {
  id: string;
  taskKind?: "task" | "homework" | "exam";
  subject?: string;
}

test("filterByKind: คัดเฉพาะงานที่ตรงชนิด และงานที่ไม่มีชนิด (เช่นงานจากแผน) หลุดออกเสมอ", () => {
  const tasks: FakeTask[] = [
    { id: "a", taskKind: "homework", subject: "เคมี" },
    { id: "b", taskKind: "exam" },
    { id: "c", taskKind: "task" },
    { id: "d" }, // งานที่ระบบสร้างจากแผน ไม่มี taskKind
  ];
  assert.deepEqual(
    filterByKind(tasks, "homework").map((t) => t.id),
    ["a"],
  );
  assert.deepEqual(
    filterByKind(tasks, "all").map((t) => t.id),
    ["a", "b", "c", "d"],
  );
});

test("filterBySubject: เทียบวิชาตรงตัว และ 'all' คืนทุกแถว", () => {
  const tasks: FakeTask[] = [
    { id: "a", subject: "เคมี" },
    { id: "b", subject: "ฟิสิกส์" },
    { id: "c", subject: undefined },
  ];
  assert.deepEqual(
    filterBySubject(tasks, "เคมี").map((t) => t.id),
    ["a"],
  );
  assert.equal(filterBySubject(tasks, "all").length, 3);
});

test("collectSubjects: รวมวิชาที่พบบ่อยกับที่ผู้ใช้เคยพิมพ์เอง ตัดซ้ำ", () => {
  const subjects = collectSubjects(["เคมี", "ชมรมดนตรี", "เคมี", undefined, "  "]);
  assert.ok(subjects.includes("เคมี"));
  assert.ok(subjects.includes("คณิตศาสตร์")); // มาจาก COMMON_SUBJECTS แม้ผู้ใช้ไม่เคยพิมพ์
  assert.ok(subjects.includes("ชมรมดนตรี")); // วิชานอกลิสต์ที่ผู้ใช้พิมพ์เองต้องไม่หาย
  assert.equal(subjects.filter((s) => s === "เคมี").length, 1); // ไม่ซ้ำ
});

test("subjectsInList: คืนเฉพาะวิชาที่ปรากฏจริงในลิสต์ที่ให้มา ไม่ปนวิชาที่พบบ่อยที่ไม่มีงานเลย", () => {
  const tasks: FakeTask[] = [{ id: "a", subject: "เคมี" }, { id: "b" }];
  const subjects = subjectsInList(tasks);
  assert.deepEqual(subjects, ["เคมี"]);
  assert.ok(!subjects.includes("คณิตศาสตร์"));
});
