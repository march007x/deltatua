-- plans: แผนการอ่านหนึ่งชุดต่อผู้ใช้หนึ่งคน (คนหนึ่งมีได้หลายแผน แต่ใช้งานจริงทีละแผน)
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  target_exam text not null,
  exam_date date not null,
  start_date date not null,
  minutes_per_day jsonb not null,
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  created_at timestamptz not null default now()
);

create index if not exists plans_user_id_idx on public.plans (user_id);

alter table public.plans enable row level security;

create policy "plans_select_own"
  on public.plans for select
  using (auth.uid() = user_id);

create policy "plans_insert_own"
  on public.plans for insert
  with check (auth.uid() = user_id);

create policy "plans_update_own"
  on public.plans for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "plans_delete_own"
  on public.plans for delete
  using (auth.uid() = user_id);

-- plan_items: รายการย่อยของแผนหนึ่งวัน — kind รองรับ practice/exam ไว้ล่วงหน้า แม้รอบนี้จะสร้างแค่ lesson
create table if not exists public.plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  kind text not null check (kind in ('lesson', 'practice', 'exam')),
  ref_id text not null,
  title text not null,
  minutes_planned int not null,
  status text not null default 'pending' check (status in ('pending', 'done', 'skipped')),
  done_at timestamptz,
  sort_order int not null
);

create index if not exists plan_items_plan_id_idx on public.plan_items (plan_id);
create index if not exists plan_items_user_id_idx on public.plan_items (user_id);

alter table public.plan_items enable row level security;

create policy "plan_items_select_own"
  on public.plan_items for select
  using (auth.uid() = user_id);

create policy "plan_items_insert_own"
  on public.plan_items for insert
  with check (auth.uid() = user_id);

create policy "plan_items_update_own"
  on public.plan_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "plan_items_delete_own"
  on public.plan_items for delete
  using (auth.uid() = user_id);
