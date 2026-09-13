import type { Metadata } from "next";
import { LoginConsent } from "@/components/login/LoginConsent";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ",
  description: "เข้าสู่ระบบด้วย Google เพื่อบันทึกความก้าวหน้าการเรียน หรือเรียนต่อแบบไม่ผูกบัญชี",
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-hero-bg px-5 py-16">
      <div className="relative">
        <LoginConsent />
      </div>
    </div>
  );
}
