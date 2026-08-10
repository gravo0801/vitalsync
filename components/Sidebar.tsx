"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, User, Utensils, Sparkles,
  Menu, X, Sun, Moon,
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
  { href: "/meals", label: "식사 일지", icon: <Utensils size={16} />, group: "OVERVIEW" },
  { href: "/inbody", label: "인바디 (AI 분석)", icon: <Sparkles size={16} />, group: "OVERVIEW" },
  { href: "/profile", label: "프로필", icon: <User size={16} />, group: "관리" },
];

const GROUPS = ["OVERVIEW", "관리"];

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { theme, toggle, mounted } = useTheme();

  const navContent = (
    <>
      <div className="px-5 py-6 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[var(--color-ink-900)] dark:bg-white/10 flex items-center justify-center">
          <span className="text-white dark:text-white text-sm font-semibold tabular">V</span>
        </div>
        <div className="leading-none">
          <span className="font-semibold text-base tracking-tight">VitalSync</span>
        </div>
      </div>

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
                    className={`flex min-h-11 items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${
                      active
                        ? "bg-[var(--color-ink-900)] dark:bg-white/10 text-white"
                        : "text-[color:var(--muted-foreground)] hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    <span className="opacity-70">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-black/5 dark:border-white/5">
        {mounted && (
          <button
            onClick={toggle}
            className="w-full min-h-11 flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[color:var(--muted-foreground)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
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
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed z-30 flex h-11 w-11 items-center justify-center rounded-xl bg-white/85 dark:bg-[var(--color-ink-900)]/85 backdrop-blur border border-black/5 dark:border-white/5 shadow-sm"
        style={{
          top: "max(1rem, env(safe-area-inset-top))",
          left: "max(1rem, env(safe-area-inset-left))",
        }}
        aria-label="메뉴 열기"
        aria-expanded={open}
        aria-controls="vitalsync-sidebar"
      >
        <Menu size={19} />
      </button>

      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        id="vitalsync-sidebar"
        className={`
          fixed lg:sticky top-0 left-0 h-[100dvh] w-60 z-50
          bg-[var(--color-cream-150)] dark:bg-[var(--color-ink-900)]
          border-r border-black/5 dark:border-white/5
          flex flex-col
          pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]
          transition-transform duration-200
          ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
        `}
      >
        <button
          onClick={() => setOpen(false)}
          className="lg:hidden absolute top-4 right-4 flex h-11 w-11 items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
          aria-label="메뉴 닫기"
        >
          <X size={18} />
        </button>
        {navContent}
      </aside>
    </>
  );
}
