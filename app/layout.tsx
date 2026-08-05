import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import AuthGate from "@/components/AuthGate";

export const metadata: Metadata = {
  title: "VitalSync",
  description: "스마트 다이어트 & 바디 관리",
};

const themeScript = `
  (function() {
    try {
      var t = localStorage.getItem('vitalsync-theme-v3') || 'light';
      if (t === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    } catch(e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const previewBypass = process.env.VERCEL_ENV === "preview";

  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        <AuthGate previewBypass={previewBypass}>{children}</AuthGate>
        <Toaster position="top-center" richColors closeButton theme="system" />
      </body>
    </html>
  );
}
