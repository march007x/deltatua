-- profiles: ข้อมูลผู้ใช้ขั้นต่ำที่จำเป็นต่อการคำนวณแผนและติดต่อ (สร้างแถวจากฝั่งแอปตอน auth callback)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  grade text,
  target_exams text[] not null default '{}',
  timezone text not null default 'Asia/Bangkok',
  consented_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- เจ้าของบัญชีเท่านั้นที่เข้าถึงแถวของตัวเองได้ — ครบทั้ง select/insert/update/delete
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = id);
