-- watchlist: สนามสอบที่ผู้ใช้กดติดตาม — exam_id อ้างอิง id ในไฟล์ src/content/exams.ts
-- (ไม่มี foreign key เพราะตารางสอบเป็นไฟล์ข้อมูลในโปรเจกต์ ไม่ใช่ตารางฐานข้อมูล เหมือน lesson_id ในตารางอื่น)
create table if not exists public.watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  exam_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, exam_id)
);

create index if not exists watchlist_user_id_idx on public.watchlist (user_id);

alter table public.watchlist enable row level security;

create policy "watchlist_select_own"
  on public.watchlist for select
  using (auth.uid() = user_id);

create policy "watchlist_insert_own"
  on public.watchlist for insert
  with check (auth.uid() = user_id);

create policy "watchlist_update_own"
  on public.watchlist for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "watchlist_delete_own"
  on public.watchlist for delete
  using (auth.uid() = user_id);
