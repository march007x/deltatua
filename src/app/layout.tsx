import type { Metadata, Viewport } from "next";
import { Anuphan } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";
import { SITE } from "@/lib/site";
import { SITE_URL } from "@/lib/url";
import { AppShell } from "@/components/layout/AppShell";

/** ฟอนต์เดียวทั้งเว็บ (P9 ข้อ 12) — โหลดผ่าน next/font/google เอง ไม่ผ่าน <link> เพื่อให้ self-host
 * และไม่มี layout shift ระหว่างรอโหลด ตัวแปร --font-anuphan ถูกอ้างถึงใน globals.css */
const anuphan = Anuphan({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-anuphan",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "คณิตศาสตร์",
    "ม.4",
    "ม.5",
    "ม.6",
    "กราฟโต้ตอบ",
    "ฟังก์ชันกำลังสอง",
    "ตรีโกณมิติ",
    "อนุพันธ์",
    "แคลคูลัส",
  ],
  openGraph: {
    type: "website",
    locale: "th_TH",
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: SITE_URL,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: `${SITE.name} — ${SITE.tagline}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef0f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0b0f" },
  ],
};

/** ตั้งธีมก่อนหน้าจอวาดครั้งแรก เพื่อไม่ให้เห็นสีกะพริบตอนโหลด */
const THEME_INIT = `(function(){try{var t=localStorage.getItem("delta-theme");if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: data-theme ถูก THEME_INIT ตั้งค่าก่อน React hydrate เสมอ (กันจอกะพริบ)
    // ทำให้ attribute นี้ไม่ตรงกับ HTML ที่ server render ไว้โดยตั้งใจ — ไม่ใช่บั๊ก แค่บอก React ว่ารู้แล้ว
    <html lang="th" suppressHydrationWarning className={anuphan.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-ink focus:shadow-lg"
        >
          ข้ามไปเนื้อหาหลัก
        </a>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
