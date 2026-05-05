import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VitalSync",
  description: "스마트 다이어트 & 바디 관리",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-zinc-100`}>
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}