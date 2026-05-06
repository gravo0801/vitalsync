"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, User, Activity, Utensils, Dumbbell,
  TrendingUp, Settings, Menu, X, Sun, Moon,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  group: string;
}

const NAV: NavItem[] = [
  { href: "/", label: "대시보드", icon: <LayoutDashboard size={16} />, group: "OVERVIEW" },
  { href: "/profile", label: "프로필", icon: <User size={16} />, group: "관리" },
];

const GROUPS = ["OVERVIEW", "관리"];

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { theme, toggle, mounted } = useTheme();

  const navContent = (
    <>
      {/* 로고 */}
      <div className="px-5 py-6 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[var(--color-ink-900)] dark:bg-white/10 flex items-center justify-center">
          <span className="text-white dark:text-white text-sm font-semibold tabular">V</span>
        </div>
        <div className="leading-none">
          <span className="font-semibold text-base tracking-tight">VitalSync</span>
        </div>
      </div>

      {/* 메뉴 */}
      <nav className="flex-1 px-3 space-y-6 mt-2">
        {GROUPS.map((group) => (
          <div key={group}>
            <div className="px-3 mb-2 text-[11px] tracking-wider text-[color:var(--muted)] font-medium uppercase">
              {group}
            </div>
            <div className="space-y-0.5">
              {NAV.filter((n) => n.group === group).map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${
                      active
                        ? "bg-[var(--color-ink-900)] dark:bg-white/10 text-white"
                        : "text-[color:var(--muted-foreground)] hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    <span className="w-1 h-1 rounded-full bg-current opacity-50" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* 하단 - 테마 토글 */}
      <div className="p-3 border-t border-black/5 dark:border-white/5">
        {mounted && (
          <button
            onClick={toggle}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[color:var(--muted-foreground)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            {theme === "dark" ? "라이트 모드" : "다크 모드"}
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* 모바일 햄버거 (sm 이하) */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-30 p-2 rounded-xl bg-white/80 dark:bg-[var(--color-ink-900)]/80 backdrop-blur border border-black/5 dark:border-white/5"
        aria-label="메뉴 열기"
      >
        <Menu size={18} />
      </button>

      {/* 모바일 오버레이 */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* 사이드바 본체 */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen w-60 z-50
          bg-[var(--color-cream-150)] dark:bg-[var(--color-ink-900)]
          border-r border-black/5 dark:border-white/5
          flex flex-col
          transition-transform duration-200
          ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
        `}
      >
        {/* 모바일 닫기 */}
        <button
          onClick={() => setOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
        >
          <X size={18} />
        </button>
        {navContent}
      </aside>
    </>
  );
}
