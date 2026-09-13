-- P5.1: เพิ่มชนิดงาน (task/homework/exam) และวิชา ให้ tasks รองรับงานนอกเหนือจากคณิตของ Delta
-- บวกเพิ่มอย่างเดียว ไม่แก้/ลบคอลัมน์เดิม แถวเก่าที่ไม่มีค่าสองคอลัมน์นี้ยังอ่าน/แสดงผลได้ปกติ
-- (kind มี default ครอบคลุมแถวเก่าทันทีที่ ALTER TABLE รัน, subject เป็น null ได้อยู่แล้ว)
alter table public.tasks
  add column if not exists kind text not null default 'task' check (kind in ('task', 'homework', 'exam')),
  add column if not exists subject text;
