import Link from "next/link";
import { cx } from "@/lib/utils";

/**
 * ระบบปุ่มเดียวทั้งเว็บ (P9 ข้อ 10/12) — สามระดับ ไม่มีระดับที่สี่ตามสเปก:
 * primary (ทึบ, ใช้ได้แค่ 1 ปุ่มต่อหน้าจอ) / secondary (พื้นจาง) / ghost (ไม่มีพื้น)
 * สูง/กว้างอย่างน้อย 44px, รัศมี r-pill (แคปซูล ไม่ใช่ r-field ที่ใช้กับช่องกรอก/การ์ด),
 * active ยุบลงเล็กน้อย, focus-visible มีวงแหวนเห็นชัดสองธีม, ปุ่มโหลดอยู่กดซ้ำไม่ได้
 *
 * primary ต้องอ่านสีตัวอักษรจาก --accent-on เสมอ ห้าม hardcode เป็น text-white — ธีมมืด
 * accent เป็นฟ้าอ่อน (#7ca5ff) ตัวอักษรขาวบนพื้นนั้นคอนทราสต์ไม่ถึง AA แต่ accent-on ของธีมมืด
 * คือ #0a0b0f (เกือบดำ) ซึ่งอ่านออกจริง · hover ใช้ accent-press (สีทึบขึ้น) แทนการลด opacity
 * เพราะ opacity ลดทั้งพื้นและตัวอักษรพร้อมกัน ทำให้คอนทราสต์ตกตอน hover ไปด้วย
 */
export type ButtonVariant = "primary" | "secondary" | "ghost";

const BASE =
  "inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-pill px-4 " +
  "text-[15px] font-medium no-underline transition duration-[160ms] ease-standard " +
  "active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed " +
  "disabled:opacity-50 disabled:active:scale-100";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-on shadow-sh-1 hover:bg-accent-press",
  secondary: "bg-accent-soft text-accent-ink hover:opacity-80",
  ghost: "bg-transparent text-ink-2 hover:bg-surface-2 hover:text-ink",
};

function buttonClasses(variant: ButtonVariant, className?: string) {
  return cx(BASE, VARIANT[variant], className);
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  variant?: ButtonVariant;
  loading?: boolean;
  className?: string;
}

export function Button({
  variant = "secondary",
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses(variant, className)}
      {...rest}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

export interface LinkButtonProps
  extends Omit<React.ComponentProps<typeof Link>, "className"> {
  variant?: ButtonVariant;
  className?: string;
}

/** เวอร์ชัน <a> (ผ่าน next/link) ของปุ่มเดียวกัน — ใช้ตอนปุ่มที่จริงคือการนำทาง ไม่ใช่ทำ action ในหน้า */
export function LinkButton({ variant = "secondary", className, children, ...rest }: LinkButtonProps) {
  return (
    <Link className={buttonClasses(variant, className)} {...rest}>
      {children}
    </Link>
  );
}
