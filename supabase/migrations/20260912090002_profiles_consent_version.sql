-- profiles.consent_version: เวอร์ชันข้อตกลงยินยอมที่ผู้ใช้กดตอนสร้างบัญชี ตั้งครั้งเดียวตอนสร้างโปรไฟล์
alter table public.profiles
  add column if not exists consent_version text not null default '2026-09-12';
