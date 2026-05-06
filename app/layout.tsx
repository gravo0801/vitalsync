import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "VitalSync",
  description: "스마트 다이어트 & 바디 관리",
};

// hydration mismatch 방지 - 첫 렌더링 전에 localStorage 읽어 dark 클래스 미리 부착
const themeScript = `
  (function() {
    try {
      var t = localStorage.getItem('vitalsync-theme') || 'dark';
      if (t === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    } catch(e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans bg-amber-50 dark:bg-zinc-950 text-stone-900 dark:text-zinc-100 transition-colors antialiased">
        {children}
        <Toaster position="top-center" richColors closeButton theme="system" />
      </body>
    </html>
  );
}
