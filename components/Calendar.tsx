"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, addMonths, subMonths, isToday,
} from "date-fns";
import { ko } from "date-fns/locale";
import type { WeightRecord, MealRecord, WorkoutWithPtNumber, MedicationRecord } from "@/types";
import { Card } from "./SummaryCards";

interface Props {
  weights: WeightRecord[];
  meals: MealRecord[];
  workouts: WorkoutWithPtNumber[];
  medications?: MedicationRecord[];
  onSelectDate: (date: string) => void;
}

export default function Calendar({ weights, meals, workouts, medications = [], onSelectDate }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getStatus = (dateStr: string) => {
    const dayWorkouts = workouts.filter((w) => w.date === dateStr);
    const ptWorkout = dayWorkouts.find((w) => w.category === "PT");
    const personalWorkout = dayWorkouts.find((w) => w.category !== "PT");
    return {
      weight: weights.find((w) => w.date === dateStr)?.weight,
      hasMeal: meals.some((m) => m.date === dateStr),
      hasPT: !!ptWorkout,
      hasPersonal: !!personalWorkout,
      ptNumber: ptWorkout?.ptNumber,
      hasMedication: medications.some((m) => m.date === dateStr),
    };
  };

  return (
    <Card>
      <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-center justify-between gap-3 mb-5">
        <h3 className="text-base font-semibold tracking-tight">
          월별 <span className="serif-italic">기록</span>
        </h3>
        <div className="flex w-full min-[420px]:w-auto items-center justify-between min-[420px]:justify-start gap-1 text-sm">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
            aria-label="이전 달"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="font-medium min-w-28 text-center text-sm tabular">
            {format(currentMonth, "yyyy년 MM월", { locale: ko })}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
            aria-label="다음 달"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap items-center gap-x-3 min-[420px]:gap-x-4 gap-y-1.5 mb-4 text-[11px] text-[color:var(--muted-foreground)]">
        <LegendItem color="var(--color-terra-500)" label="식사" />
        <LegendItem color="var(--color-sage-500)" label="개인 운동" />
        <LegendItem color="var(--color-wine-500)" label="PT" />
        <LegendItem color="var(--color-mauve-500)" label="Mounjaro" />
      </div>

      <div className="grid grid-cols-7 gap-0.5 min-[420px]:gap-1 text-center">
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
                relative h-14 min-[420px]:h-16 flex flex-col items-center justify-center rounded-lg
                hover:bg-black/4 dark:hover:bg-white/5 transition-colors
                ${today ? "bg-[var(--color-sage-500)]/8 ring-1 ring-[var(--color-sage-500)]/40" : ""}
              `}
            >
              {/* PT 회차 뱃지 (우상단) */}
              {status.hasPT && status.ptNumber && (
                <span className="absolute top-1 right-1 text-[8px] font-semibold tabular bg-[var(--color-wine-500)] text-white px-1 py-px rounded-sm leading-none">
                  PT{status.ptNumber}
                </span>
              )}
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
                {status.hasPersonal && (
                  <div className="w-1 h-1 rounded-full bg-[var(--color-sage-500)]" />
                )}
                {status.hasPT && (
                  <div className="w-1 h-1 rounded-full bg-[var(--color-wine-500)]" />
                )}
                {status.hasMedication && (
                  <div className="w-1 h-1 rounded-full bg-[var(--color-mauve-500)]" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      <span>{label}</span>
    </div>
  );
}
