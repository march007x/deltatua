-- tasks: งานที่ผู้ใช้พิมพ์เอง (source='user') เท่านั้นที่ถูกเขียนลงตารางนี้จริง
-- งานที่ระบบสร้างจากแผน (source='generated') คำนวณสดจาก plan_items ตอนแสดงผล ไม่ insert ลงตารางนี้
-- เพราะ plan_items เปลี่ยนบ่อย (ลาก/ลบ/จัดใหม่ได้จากหน้า /plan) การ sync สองตารางจะยิ่งเพิ่มจุดพัง
-- คอลัมน์ source/plan_item_id ยังคงไว้ตามสเปกเผื่ออนาคตต้องการ "ปักหมุด" งานจากแผนเป็นรายการถาวร
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  note text,
  due_date date,
  due_time time,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  source text not null default 'user' check (source in ('user', 'generated')),
  lesson_id text,
  plan_item_id uuid,
  done_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists tasks_user_id_idx on public.tasks (user_id);

alter table public.tasks enable row level security;

create policy "tasks_select_own"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "tasks_insert_own"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "tasks_update_own"
  on public.tasks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "tasks_delete_own"
  on public.tasks for delete
  using (auth.uid() = user_id);
