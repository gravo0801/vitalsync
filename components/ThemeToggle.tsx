"use client";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export default function ThemeToggle() {
  const { theme, toggle, mounted } = useTheme();
  if (!mounted) return <div className="w-9 h-9" />;
  return (
    <button
      onClick={toggle}
      className="p-2 rounded-xl hover:bg-amber-200 dark:hover:bg-zinc-800 transition-colors"
      aria-label="테마 전환"
    >
      {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
