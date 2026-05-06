"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, addMonths, subMonths, isToday,
} from "date-fns";
import { ko } from "date-fns/locale";
import type { WeightRecord, MealRecord, WorkoutRecord } from "@/types";
import { Card } from "./SummaryCards";

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
    <Card>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold tracking-tight">
          월별 <span className="serif-italic">기록</span>
        </h3>
        <div className="flex items-center gap-1 text-sm">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="font-medium w-28 text-center text-sm tabular">
            {format(currentMonth, "yyyy년 MM월", { locale: ko })}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
          <div
            key={d}
            className={`text-[11px] font-medium py-2 ${
              i === 0 ? "text-[var(--color-wine-500)]" : "text-[color:var(--muted)]"
            }`}
          >
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
          const dayOfWeek = getDay(day);
          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`
                h-14 flex flex-col items-center justify-center rounded-lg
                hover:bg-black/4 dark:hover:bg-white/5 relative transition-colors
                ${today ? "bg-[var(--color-sage-500)]/8 ring-1 ring-[var(--color-sage-500)]/40" : ""}
              `}
            >
              <span
                className={`text-sm tabular ${
                  today ? "font-semibold text-[var(--color-sage-600)] dark:text-[var(--color-sage-400)]"
                  : dayOfWeek === 0 ? "text-[var(--color-wine-500)]"
                  : ""
                }`}
              >
                {format(day, "d")}
              </span>
              {status.weight && (
                <span className="text-[9px] text-[color:var(--muted)] tabular">
                  {status.weight}
                </span>
              )}
              <div className="flex gap-0.5 mt-0.5">
                {status.hasMeal && (
                  <div className="w-1 h-1 rounded-full bg-[var(--color-terra-500)]" />
                )}
                {status.hasWorkout && (
                  <div className="w-1 h-1 rounded-full bg-[var(--color-slate-blue-500)]" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
