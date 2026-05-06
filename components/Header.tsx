"use client";
import Link from "next/link";
import { Plus, User } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface Props {
  onAddWeight: () => void;
  onAddMeal: () => void;
  onAddWorkout: () => void;
}

export default function Header({ onAddWeight, onAddMeal, onAddWorkout }: Props) {
  return (
    <header className="border-b border-amber-200 dark:border-zinc-800 bg-amber-100/90 dark:bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 bg-emerald-500 rounded-2xl flex items-center justify-center">
            <span className="text-white font-bold text-2xl">V</span>
          </div>
          <h1 className="font-semibold text-xl sm:text-2xl tracking-tight">VitalSync</h1>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onAddWeight}
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 px-3 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-medium text-white active:scale-95 transition"
          >
            <Plus size={16} /> 체중
          </button>
          <button
            onClick={onAddMeal}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 px-3 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-medium text-white active:scale-95 transition"
          >
            <Plus size={16} /> 식사
          </button>
          <button
            onClick={onAddWorkout}
            className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 px-3 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-medium text-white active:scale-95 transition"
          >
            <Plus size={16} /> 운동
          </button>
          <ThemeToggle />
          <Link
            href="/profile"
            className="p-2 rounded-xl hover:bg-amber-200 dark:hover:bg-zinc-800 transition-colors"
            aria-label="프로필"
          >
            <User size={20} />
          </Link>
        </div>
      </div>
    </header>
  );
}
