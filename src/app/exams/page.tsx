import type { Metadata } from "next";
import { examSchedule } from "@/content/exams";
import { ExamsPageClient } from "@/components/exams/ExamsPageClient";

export const metadata: Metadata = {
  title: "ตารางสอบ TGAT/TPAT/A-Level",
  description: "นับถอยหลังสนามสอบ TGAT, TPAT1-5 และ A-Level ทุกรายวิชา — ดูได้โดยไม่ต้องล็อกอิน",
};

export default function ExamsPage() {
  return <ExamsPageClient exams={examSchedule} />;
}
