-- attempts: หนึ่งแถวต่อหนึ่งครั้งที่ตอบโจทย์ (practice หรือ exam) — เก็บเหตุการณ์ดิบ ไม่เก็บเปอร์เซ็นต์สรุป
-- id สร้างจากฝั่ง client แล้วส่งมา ไม่ใช้ gen_random_uuid() เพื่อให้ upsert onConflict(id) กันแถวซ้ำ
-- ตอนกดส่งซ้ำหลังเน็ตหลุดได้
create table if not exists public.attempts (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id text not null,
  lesson_id text not null,
  exam_id text null,
  is_correct boolean not null,
  seconds int not null,
  created_at timestamptz not null default now()
);

create index if not exists attempts_user_id_idx on public.attempts (user_id);

alter table public.attempts enable row level security;

create policy "attempts_select_own"
  on public.attempts for select
  using (auth.uid() = user_id);

create policy "attempts_insert_own"
  on public.attempts for insert
  with check (auth.uid() = user_id);

create policy "attempts_update_own"
  on public.attempts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "attempts_delete_own"
  on public.attempts for delete
  using (auth.uid() = user_id);

-- study_sessions: หนึ่งแถวต่อหนึ่งช่วงเวลาที่ทำกิจกรรมต่อเนื่องจริง (อ่านบท / ฝึกโจทย์ / ทำข้อสอบ)
-- minutes นับเฉพาะเวลาที่มีการกระทำจริง ไม่นับช่วงเปิดแท็บค้างไว้เกิน 5 นาที
create table if not exists public.study_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  source text not null check (source in ('lesson', 'practice', 'exam')),
  ref_id text not null,
  minutes int not null,
  started_at timestamptz not null,
  ended_at timestamptz not null
);

create index if not exists study_sessions_user_id_idx on public.study_sessions (user_id);

alter table public.study_sessions enable row level security;

create policy "study_sessions_select_own"
  on public.study_sessions for select
  using (auth.uid() = user_id);

create policy "study_sessions_insert_own"
  on public.study_sessions for insert
  with check (auth.uid() = user_id);

create policy "study_sessions_update_own"
  on public.study_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "study_sessions_delete_own"
  on public.study_sessions for delete
  using (auth.uid() = user_id);

-- exam_results: สรุปผลข้อสอบจำลองหนึ่งชุดที่ทำจบหนึ่งครั้ง
create table if not exists public.exam_results (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  exam_id text not null,
  score int not null,
  max_score int not null,
  seconds int not null,
  weak_topics jsonb not null default '[]'::jsonb,
  taken_at timestamptz not null default now()
);

create index if not exists exam_results_user_id_idx on public.exam_results (user_id);

alter table public.exam_results enable row level security;

create policy "exam_results_select_own"
  on public.exam_results for select
  using (auth.uid() = user_id);

create policy "exam_results_insert_own"
  on public.exam_results for insert
  with check (auth.uid() = user_id);

create policy "exam_results_update_own"
  on public.exam_results for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "exam_results_delete_own"
  on public.exam_results for delete
  using (auth.uid() = user_id);
