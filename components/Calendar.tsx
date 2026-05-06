"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, addMonths, subMonths, isToday,
} from "date-fns";
import { ko } from "date-fns/locale";
import type { WeightRecord, MealRecord, WorkoutRecord } from "@/types";

interface Props {
  weights: WeightRecord[];
  meals: MealRecord[];
  workouts: WorkoutRecord[];
  onSelectDate: (date: string) => void;
}

export default function Calendar({ weights, meals, workouts, onSelectDate }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getStatus = (dateStr: string) => ({
    weight: weights.find((w) => w.date === dateStr)?.weight,
    hasMeal: meals.some((m) => m.date === dateStr),
    hasWorkout: workouts.some((w) => w.date === dateStr),
  });

  return (
    <div className="rounded-3xl p-6 bg-white dark:bg-zinc-900 border border-amber-200 dark:border-zinc-800 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-xl flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" /> 캘린더
        </h3>
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-amber-200 dark:hover:bg-zinc-800 rounded-xl"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="font-medium w-32 text-center">
            {format(currentMonth, "yyyy년 MM월", { locale: ko })}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-amber-200 dark:hover:bg-zinc-800 rounded-xl"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <div key={d} className="font-medium text-stone-500 dark:text-zinc-400 py-2">
            {d}
          </div>
        ))}
        {Array.from({ length: getDay(monthStart) }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const status = getStatus(dateStr);
          const today = isToday(day);
          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`h-16 flex flex-col items-center justify-center rounded-xl hover:bg-amber-200 dark:hover:bg-zinc-800 relative transition ${
                today ? "ring-2 ring-emerald-500" : ""
              }`}
            >
              <span className={today ? "font-bold text-emerald-500" : ""}>
                {format(day, "d")}
              </span>
              {status.weight && (
                <span className="text-[10px] text-stone-500 dark:text-zinc-400">
                  {status.weight}
                </span>
              )}
              <div className="flex gap-1 mt-0.5">
                {status.hasMeal && <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />}
                {status.hasWorkout && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
