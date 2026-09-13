"use client";

import { useMemo, useState } from "react";
import { cx } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DAY_MS, parseIsoDate } from "@/lib/planner/generate";
import type { ProgressLesson } from "@/lib/repo/progress-index";
import { useTasks, type UnifiedTask } from "@/lib/tasks/useTasks";
import type { Priority, TaskKind } from "@/lib/tasks/data";
import { filterByKind, filterBySubject, subjectsInList } from "@/lib/tasks/filter";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LinkButton } from "@/components/ui/Button";

const TABS = [
  { key: "today", label: "วันนี้" },
  { key: "upcoming", label: "ที่จะถึง" },
  { key: "all", label: "ทั้งหมด" },
  { key: "done", label: "เสร็จแล้ว" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const PRIORITY_LABEL: Record<Priority, string> = { low: "ต่ำ", medium: "กลาง", high: "สูง" };
const KIND_LABEL: Record<TaskKind, string> = { task: "งานทั่วไป", homework: "การบ้าน", exam: "สอบ" };
const KIND_TONE: Record<TaskKind, "neutral" | "accent" | "warn"> = {
  task: "neutral",
  homework: "accent",
  exam: "warn",
};
const KIND_FILTERS = [
  { key: "all", label: "ทุกชนิด" },
  { key: "task", label: KIND_LABEL.task },
  { key: "homework", label: KIND_LABEL.homework },
  { key: "exam", label: KIND_LABEL.exam },
] as const;

const todayIso = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());

/** จำนวนวันที่เหลือถึงวันครบกำหนด (ลบได้ถ้าผ่านไปแล้ว) — ใช้กับงานชนิด "สอบ" ที่ไม่ใช่ของที่ต้องส่ง */
function daysUntil(dueDateIso: string): number {
  return Math.round((parseIsoDate(dueDateIso) - parseIsoDate(todayIso)) / DAY_MS);
}

export function TasksPageClient({ lessons }: { lessons: ProgressLesson[] }) {
  const tasks = useTasks(lessons);
  const [tab, setTab] = useState<TabKey>("today");
  const [formOpen, setFormOpen] = useState(false);
  const [kindFilter, setKindFilter] = useState<TaskKind | "all">("all");
  const [subjectFilter, setSubjectFilter] = useState<string | "all">("all");

  const baseList = useMemo(() => (tasks.ready ? tasks[tab] : []), [tasks, tab]);
  const availableSubjects = useMemo(() => subjectsInList(baseList), [baseList]);
  const list = useMemo(
    () => filterBySubject(filterByKind(baseList, kindFilter), subjectFilter),
    [baseList, kindFilter, subjectFilter],
  );

  if (!tasks.ready) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-12">
        <p className="m-0 rounded-card border border-dashed border-line-strong bg-surface-2 px-4 py-8 text-center text-[14px] text-ink-3">
          กำลังโหลด…
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <header className="mb-6 border-b border-line pb-6">
        <Eyebrow>จัดการงาน</Eyebrow>
        <h1 className="m-0 mb-3 font-display text-[clamp(26px,4vw,38px)] font-bold tracking-tight text-ink">
          งานที่ต้องทำ
        </h1>
        <p className="m-0 max-w-[62ch] text-[15px] leading-relaxed text-ink-2">
          รวมงานจากแผนอ่าน (วันนี้และที่เลยกำหนดแต่ยังไม่เสร็จ) กับงานที่พิมพ์เองไว้ในที่เดียว
        </p>
        <p className="m-0 mt-3 rounded-pill border border-line bg-surface-2 px-3.5 py-2 text-[13px] font-medium tabular-nums text-ink-2">
          วันนี้เสร็จ {tasks.todayDoneCount.done} จาก {tasks.todayDoneCount.total} งาน
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button
            key={t.key}
            variant={tab === t.key ? "secondary" : "ghost"}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </Button>
        ))}
        <Button variant="primary" className="ml-auto" onClick={() => setFormOpen((v) => !v)}>
          {formOpen ? "ปิดฟอร์ม" : "+ เพิ่มงาน"}
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {KIND_FILTERS.map((k) => (
          <Button
            key={k.key}
            variant={kindFilter === k.key ? "secondary" : "ghost"}
            onClick={() => setKindFilter(k.key)}
          >
            {k.label}
          </Button>
        ))}
        {availableSubjects.length > 0 ? (
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="rounded-field border border-line-strong bg-surface px-2.5 py-1.5 text-[13px] text-ink-2 outline-none focus:border-accent"
          >
            <option value="all">ทุกวิชา</option>
            {availableSubjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      {formOpen ? (
        <TaskForm
          lessons={lessons}
          knownSubjects={tasks.knownSubjects}
          onSubmit={async (input) => {
            const r = await tasks.addTask(input);
            if (r.ok) setFormOpen(false);
          }}
        />
      ) : null}

      <div className="mt-4 flex flex-col gap-2.5">
        {list.length === 0 ? (
          <p className="m-0 rounded-card border border-dashed border-line-strong bg-surface-2 px-4 py-6 text-center text-[14px] text-ink-3">
            ไม่มีงานในหมวดนี้
          </p>
        ) : (
          list.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              readOnlyDone={tab === "done"}
              onToggle={() => {
                if (t.source === "generated") void tasks.toggleGeneratedDone(t);
                else void tasks.toggleUserDone(t.id, !t.done);
              }}
              onRemove={t.source === "user" ? () => void tasks.removeTask(t.id) : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ExamDueLabel({ dueDate, overdue }: { dueDate: string; overdue: boolean }) {
  const days = daysUntil(dueDate);
  const label = days === 0 ? "สอบวันนี้" : days > 0 ? `เหลืออีก ${days} วัน` : `ผ่านไปแล้ว ${-days} วัน`;
  return <span className={overdue ? "text-danger" : ""}>{label}</span>;
}

function TaskRow({
  task,
  onToggle,
  onRemove,
  readOnlyDone,
}: {
  task: UnifiedTask;
  onToggle: () => void;
  onRemove?: () => void;
  readOnlyDone: boolean;
}) {
  return (
    <div
      className={cx(
        "flex items-center gap-3 rounded-field border p-3.5",
        task.overdue && !task.done ? "border-danger bg-danger-soft" : "border-line bg-surface",
      )}
    >
      <input
        type="checkbox"
        checked={task.done}
        disabled={readOnlyDone}
        onChange={onToggle}
        aria-label={task.done ? "ยกเลิกทำเครื่องหมายเสร็จ" : "ทำเครื่องหมายว่าเสร็จ"}
        className="h-4 w-4 shrink-0 accent-ink"
      />
      <div className="min-w-0 flex-1">
        <p className={cx("m-0 text-[15px]", task.done ? "text-ink-3 line-through" : "text-ink")}>
          {task.title}
        </p>
        <p className="m-0 mt-0.5 flex flex-wrap items-center gap-2 text-[12.5px] text-ink-3">
          <span
            className={cx(
              "rounded px-1.5 py-0.5",
              task.source === "generated" ? "bg-accent-soft text-ink" : "bg-surface-2 text-ink-3",
            )}
          >
            {task.source === "generated" ? "จากแผน" : "งานของฉัน"}
          </span>
          {task.taskKind ? <Badge tone={KIND_TONE[task.taskKind]}>{KIND_LABEL[task.taskKind]}</Badge> : null}
          {task.subject ? <span>{task.subject}</span> : null}
          {task.dueDate ? (
            task.taskKind === "exam" ? (
              <ExamDueLabel dueDate={task.dueDate} overdue={task.overdue && !task.done} />
            ) : (
              <span className={task.overdue && !task.done ? "text-danger" : ""}>
                {task.dueDate}
                {task.dueTime ? ` ${task.dueTime}` : ""}
                {task.overdue && !task.done ? " · เลยกำหนด" : ""}
              </span>
            )
          ) : null}
          {task.priority ? <span>ความสำคัญ: {PRIORITY_LABEL[task.priority]}</span> : null}
          {task.minutesPlanned ? <span>{task.minutesPlanned} นาที</span> : null}
        </p>
        {task.note ? <p className="m-0 mt-1 text-[13px] text-ink-3">{task.note}</p> : null}
      </div>
      {task.lessonSlug && !task.done ? (
        <LinkButton href={`/lesson/${task.lessonSlug}`} variant="ghost">
          เปิดบท
        </LinkButton>
      ) : null}
      {onRemove ? (
        <Button variant="ghost" onClick={onRemove} aria-label="ลบงาน">
          ลบ
        </Button>
      ) : null}
    </div>
  );
}

function TaskForm({
  lessons,
  knownSubjects,
  onSubmit,
}: {
  lessons: ProgressLesson[];
  knownSubjects: string[];
  onSubmit: (input: {
    title: string;
    note?: string;
    dueDate?: string;
    dueTime?: string;
    priority: Priority;
    kind?: TaskKind;
    subject?: string;
    lessonId?: string;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [kind, setKind] = useState<TaskKind>("task");
  const [subject, setSubject] = useState("");
  const [note, setNote] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [lessonId, setLessonId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    await onSubmit({
      title: title.trim(),
      note: note.trim() || undefined,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      priority,
      kind,
      subject: subject.trim() || undefined,
      lessonId: lessonId || undefined,
    });
    setSubmitting(false);
    setTitle("");
    setNote("");
    setDueDate("");
    setDueTime("");
    setPriority("medium");
    setKind("task");
    setSubject("");
    setLessonId("");
    setDetailsOpen(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 flex flex-col gap-3 rounded-card border border-line bg-surface p-4"
    >
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="ชื่องาน (จำเป็น) — พิมพ์แล้วกด Enter บันทึกได้ทันที"
          autoFocus
          className="min-w-0 flex-1 rounded-field border border-line-strong bg-surface-2 px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-accent"
        />
        <Button type="button" variant="ghost" onClick={() => setDetailsOpen((v) => !v)}>
          {detailsOpen ? "ซ่อนรายละเอียด" : "เพิ่มรายละเอียด"}
        </Button>
      </div>

      {detailsOpen ? (
        <div className="flex flex-wrap gap-2">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as TaskKind)}
            className="rounded-field border border-line-strong bg-surface-2 px-3 py-2 text-[13.5px] text-ink outline-none focus:border-accent"
          >
            <option value="task">งานทั่วไป</option>
            <option value="homework">การบ้าน</option>
            <option value="exam">สอบ</option>
          </select>
          <input
            type="text"
            list="task-subject-options"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="วิชา (พิมพ์เองได้)"
            className="min-w-0 flex-1 rounded-field border border-line-strong bg-surface-2 px-3 py-2 text-[13.5px] text-ink outline-none focus:border-accent"
          />
          <datalist id="task-subject-options">
            {knownSubjects.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-field border border-line-strong bg-surface-2 px-3 py-2 text-[13.5px] tabular-nums text-ink outline-none focus:border-accent"
          />
          <input
            type="time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
            className="rounded-field border border-line-strong bg-surface-2 px-3 py-2 text-[13.5px] tabular-nums text-ink outline-none focus:border-accent"
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="rounded-field border border-line-strong bg-surface-2 px-3 py-2 text-[13.5px] text-ink outline-none focus:border-accent"
          >
            <option value="low">ความสำคัญต่ำ</option>
            <option value="medium">ความสำคัญกลาง</option>
            <option value="high">ความสำคัญสูง</option>
          </select>
          <select
            value={lessonId}
            onChange={(e) => setLessonId(e.target.value)}
            className="min-w-0 flex-1 rounded-field border border-line-strong bg-surface-2 px-3 py-2 text-[13.5px] text-ink outline-none focus:border-accent"
          >
            <option value="">ไม่ผูกกับบทเรียน</option>
            {lessons.map((l) => (
              <option key={l.slug} value={l.slug}>
                {l.title}
              </option>
            ))}
          </select>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="บันทึกเพิ่มเติม"
            rows={2}
            className="w-full rounded-field border border-line-strong bg-surface-2 px-3.5 py-2 text-[13.5px] text-ink outline-none focus:border-accent"
          />
        </div>
      ) : null}

      <Button type="submit" variant="primary" loading={submitting} disabled={!title.trim()} className="self-start">
        เพิ่มงาน
      </Button>
    </form>
  );
}
