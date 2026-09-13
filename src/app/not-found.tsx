import { LinkButton } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-24 text-center">
      <p className="m-0 mb-3 text-[13px] font-medium text-ink-3">404</p>
      <h1 className="m-0 mb-3 font-display text-[28px] font-bold text-ink">ไม่พบหน้านี้</h1>
      <p className="m-0 mb-6 text-[16px] text-ink-2">
        หน้าที่คุณเปิดอาจถูกย้าย หรือเป็นบทเรียนที่ยังเขียนไม่เสร็จ
      </p>
      <LinkButton href="/courses" variant="primary">
        ดูบทเรียนที่เปิดแล้ว
      </LinkButton>
    </div>
  );
}
