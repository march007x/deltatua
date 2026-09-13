import type { Metadata } from "next";
import {
  getChapters,
  getCourses,
  getLessons,
  getPublishedLessons,
  getTopics,
  isTopicReady,
} from "@/lib/repo/content";
import { getPracticeIndex } from "@/lib/repo/practice";
import { LEVEL_LABEL } from "@/content/schema";
import { CourseGrid, type CourseCard } from "@/components/courses/CourseGrid";
import { SubjectShowcase } from "@/components/courses/SubjectShowcase";

export const metadata: Metadata = {
  title: "คอร์สเรียน",
  description: "บทเรียนทั้งหมดตั้งแต่ ม.4 ถึง ม.6 พร้อมสถานะว่าบทไหนเปิดให้เรียนแล้ว",
};

export default function CoursesPage() {
  const courses = getCourses();
  const questionsBySlug = new Map(getPracticeIndex().map((p) => [p.slug, p.count]));

  const cards: CourseCard[] = [];
  for (const course of courses) {
    for (const chapter of getChapters(course.id)) {
      for (const topic of getTopics(chapter.id)) {
        const lesson = getLessons(topic.id)[0];
        cards.push({
          slug: lesson?.slug ?? topic.slug,
          title: topic.title,
          summary: topic.summary,
          level: LEVEL_LABEL[course.level],
          courseId: course.id,
          lessonId: lesson?.id,
          ready: isTopicReady(topic.id),
          questionCount: lesson ? (questionsBySlug.get(lesson.slug) ?? 0) : 0,
        });
      }
    }
  }

  const levels = courses.map((c) => ({ id: c.id, label: LEVEL_LABEL[c.level] }));

  /* ตัวเลขบนการ์ดคณิตศาสตร์ — นับจากไฟล์เนื้อหาจริงตอน build ไม่ได้พิมพ์ค่าไว้เอง
     วิชาอื่นยังไม่มีเนื้อหา จึงไม่มีตัวเลขให้แสดงและไม่ควรมี */
  const published = getPublishedLessons();
  const mathMeta = {
    lessons: published.length,
    hours: Math.round(published.reduce((n, l) => n + l.estimatedMinutes, 0) / 60),
    levels:
      levels.length > 1
        ? `${levels[0]?.label ?? ""}–${levels[levels.length - 1]?.label ?? ""}`
        : (levels[0]?.label ?? ""),
  };

  return (
    <>
      {/* แบนเนอร์ + ชั้นวางการ์ดวิชา — เดิมใช้ภาพภูเขาเต็มพื้นเป็นพื้นหลัง (โทน hero-* เข้มเสมอ)
          เพราะตอนนั้นการ์ดวิชาเป็นภาพถ่ายกลางคืน วางบนพื้นขาวแล้วตัวหนังสือจะอ่านไม่ออก
          ตอนนี้ (P9) การ์ดเปลี่ยนเป็นไอคอนเส้น SVG ที่มีพื้นมืดในตัวเองอยู่แล้ว (art-bg-1/art-bg-2)
          จึงไม่ต้องพึ่งพื้นหลังมืดของทั้งหน้าอีกต่อไป — หน้านี้รับธีมสว่าง/มืดตามปกติเหมือนหน้าอื่น */}
      <section className="relative overflow-hidden border-b border-line bg-surface-2">
        <div className="relative px-4 pt-12 pb-8 sm:px-6 sm:pt-16 lg:px-10">
          <p className="m-0 mb-3 text-[12.5px] font-medium text-ink-3">เรียน · เข้าใจ · ทำได้จริง</p>
          <h1 className="m-0 mb-4 max-w-[16ch] font-display text-[clamp(28px,5.2vw,46px)] leading-[1.15] font-semibold tracking-tight text-ink text-balance">
            เลือกเส้นทางการเรียนรู้ที่ใช่สำหรับคุณ
          </h1>
          <p className="m-0 max-w-[52ch] text-[clamp(14.5px,2vw,16.5px)] leading-relaxed text-ink-2">
            บทเรียนทั้งหมดออกแบบตามหลักสูตรไทย เริ่มจากคำถามว่าทำไมต้องมีเรื่องนี้
            แล้วค่อยพาไปเจอสูตร ปิดท้ายด้วยโจทย์ที่มีเฉลยบอกเหตุผล
          </p>
        </div>

        <SubjectShowcase mathMeta={mathMeta} />
      </section>

      <div id="all-lessons" className="scroll-mt-16 px-4 py-8 sm:px-6 lg:px-10">
        <CourseGrid cards={cards} levels={levels} />
      </div>
    </>
  );
}
