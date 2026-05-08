"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2, X, Search } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { toast } from "sonner";

import { useMeals } from "@/hooks/useMeals";
import { useProfile } from "@/hooks/useProfile";
import { useWorkouts } from "@/hooks/useWorkouts";
import { calculateDailyTarget } from "@/lib/calculations";

import Sidebar from "@/components/Sidebar";
import { Card } from "@/components/SummaryCards";
import MealModal from "@/components/modals/MealModal";
import type { MealRecord, MealType } from "@/types";

const MEAL_ORDER: MealType[] = ["아침", "점심", "저녁", "간식"];
const MEAL_COLOR: Record<MealType, string> = {
  아침: "var(--color-terra-400)",
  점심: "var(--color-terra-500)",
  저녁: "var(--color-terra-600)",
  간식: "var(--color-mauve-500)",
};

export default function MealsPage() {
  const { meals, loading, addMeal, deleteMeal } = useMeals();
  const { profile } = useProfile();
  const { workouts } = useWorkouts();

  const [mealOpen, setMealOpen] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState("");

  const filtered = useMemo(() => {
    if (!searchQ.trim()) return meals;
    const q = searchQ.toLowerCase();
    return meals.filter(
      (m) =>
        m.content?.toLowerCase().includes(q) ||
        m.mealType.toLowerCase().includes(q) ||
        m.date.includes(q)
    );
  }, [meals, searchQ]);

  const grouped = useMemo(() => {
    const map = new Map<string, MealRecord[]>();
    filtered.forEach((m) => {
      if (!map.has(m.date)) map.set(m.date, []);
      map.get(m.date)!.push(m);
    });
    map.forEach((arr) => {
      arr.sort((a, b) => MEAL_ORDER.indexOf(a.mealType) - MEAL_ORDER.indexOf(b.mealType));
    });
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  const handleDelete = async (meal: MealRecord) => {
    if (!confirm("정말 삭제하시겠어요?")) return;
    try {
      await deleteMeal(meal);
      toast.success("삭제되었습니다");
    } catch {
      toast.error("삭제 실패");
    }
  };

  const dailyTarget = profile ? calculateDailyTarget(profile) : 2000;

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pl-12 lg:pl-0">
            <div>
              <p className="text-sm text-[color:var(--muted)]">기록</p>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-1">
                식사 <span className="serif-italic text-[color:var(--color-terra-600)]">일지</span>
              </h1>
            </div>
            <button
              onClick={() => setMealOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium bg-[var(--color-terra-500)] hover:bg-[var(--color-terra-600)] text-white"
            >
              <Plus size={14} /> 식사 추가
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" />
              <input
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="음식 이름, 날짜, 식사 종류로 검색"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-[var(--color-ink-900)] border border-black/8 dark:border-white/10 text-sm placeholder:text-[color:var(--muted)]/60 outline-none focus:border-[var(--color-terra-500)] focus:ring-2 focus:ring-[var(--color-terra-500)]/20 transition-all"
              />
            </div>
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white dark:bg-[var(--color-ink-900)] border border-black/6 dark:border-white/6 text-sm">
              <span className="text-[color:var(--muted)]">총</span>
              <span className="font-semibold tabular">{filtered.length}건</span>
              <span className="text-[color:var(--muted)]">·</span>
              <span className="text-[color:var(--muted)]">기록일</span>
              <span className="font-semibold tabular">{grouped.length}일</span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-sm text-[color:var(--muted)]">불러오는 중...</div>
          ) : grouped.length === 0 ? (
            <Card className="text-center py-16">
              <p className="text-base font-medium mb-2">
                {searchQ ? "검색 결과가 없습니다" : "아직 식사 기록이 없습니다"}
              </p>
              {!searchQ && (
                <>
                  <p className="text-sm text-[color:var(--muted)] mb-5">
                    오늘 무엇을 드셨는지 기록해보세요
                  </p>
                  <button
                    onClick={() => setMealOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-[var(--color-terra-500)] hover:bg-[var(--color-terra-600)] text-white"
                  >
                    <Plus size={14} /> 첫 기록 추가하기
                  </button>
                </>
              )}
            </Card>
          ) : (
            <div className="space-y-6">
              {grouped.map(([date, dayMeals]) => (
                <DayGroup
                  key={date}
                  date={date}
                  meals={dayMeals}
                  todayWorkoutKcal={workouts
                    .filter((w) => w.date === date)
                    .reduce((s, w) => s + (w.caloriesBurned || 0), 0)}
                  dailyTarget={dailyTarget}
                  onPhotoClick={setLightbox}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <MealModal
        open={mealOpen}
        onClose={() => setMealOpen(false)}
        onSave={addMeal}
      />

      {lightbox && (
        <div
          className="fixed inset-0 bg-black/85 z-[100] flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
            onClick={() => setLightbox(null)}
          >
            <X size={20} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt=""
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

function DayGroup({
  date, meals, todayWorkoutKcal, dailyTarget, onPhotoClick, onDelete,
}: {
  date: string;
  meals: MealRecord[];
  todayWorkoutKcal: number;
  dailyTarget: number;
  onPhotoClick: (url: string) => void;
  onDelete: (m: MealRecord) => void;
}) {
  const totalKcal = meals.reduce((s, m) => s + (m.calories || 0), 0);
  const net = totalKcal - todayWorkoutKcal;
  const remaining = dailyTarget - net;
  const overTarget = remaining < 0;

  const d = parseISO(date);
  const isToday = format(new Date(), "yyyy-MM-dd") === date;

  return (
    <Card>
      <div className="flex items-baseline justify-between mb-4 pb-3 border-b border-black/5 dark:border-white/5">
        <div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <h2 className="text-xl font-semibold tracking-tight">
              {format(d, "yyyy년 M월 d일", { locale: ko })}
            </h2>
            <span className="text-sm text-[color:var(--muted)] serif-italic">
              {format(d, "EEEE", { locale: ko })}
            </span>
            {isToday && (
              <span className="text-[10px] font-semibold bg-[var(--color-sage-500)] text-white px-1.5 py-0.5 rounded">
                오늘
              </span>
            )}
          </div>
          <div className="text-xs text-[color:var(--muted)] mt-1 tabular">
            {meals.length}끼니
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold tabular tracking-tight">
              {totalKcal.toLocaleString()}
            </span>
            <span className="text-xs text-[color:var(--muted)]">kcal</span>
          </div>
          <div className={`text-[11px] tabular ${
            overTarget
              ? "text-[var(--color-wine-600)] dark:text-[var(--color-wine-400)]"
              : "text-[color:var(--muted)]"
          }`}>
            {overTarget
              ? `목표 +${Math.abs(remaining).toLocaleString()}`
              : `잔여 ${remaining.toLocaleString()}`
            }
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {meals.map((m) => (
          <MealCard key={m.id} meal={m} onPhotoClick={onPhotoClick} onDelete={onDelete} />
        ))}
      </div>
    </Card>
  );
}

function MealCard({
  meal, onPhotoClick, onDelete,
}: {
  meal: MealRecord;
  onPhotoClick: (url: string) => void;
  onDelete: (m: MealRecord) => void;
}) {
  const color = MEAL_COLOR[meal.mealType];

  return (
    <div className="group relative rounded-xl overflow-hidden border border-black/6 dark:border-white/6 bg-[var(--color-cream-50)] dark:bg-white/3 hover:shadow-sm transition-shadow">
      {meal.photoURL ? (
        <button
          onClick={() => meal.photoURL && onPhotoClick(meal.photoURL)}
          className="relative w-full aspect-square overflow-hidden block"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={meal.photoURL}
            alt={meal.content || meal.mealType}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-2 left-2">
            <span
              className="text-[10px] font-semibold text-white px-2 py-0.5 rounded backdrop-blur-sm"
              style={{ background: color }}
            >
              {meal.mealType}
            </span>
          </div>
        </button>
      ) : (
        <div className="relative aspect-square bg-gradient-to-br from-[var(--color-cream-150)] to-[var(--color-cream-200)] dark:from-white/5 dark:to-white/3 flex items-center justify-center">
          <div className="text-center">
            <div
              className="inline-block text-xs font-semibold text-white px-2.5 py-1 rounded mb-1"
              style={{ background: color }}
            >
              {meal.mealType}
            </div>
            <div className="text-[10px] text-[color:var(--muted)]">사진 없음</div>
          </div>
        </div>
      )}

      <div className="p-3">
        {meal.content ? (
          <p className="text-xs leading-relaxed text-[color:var(--foreground)] line-clamp-3 mb-1.5">
            {meal.content}
          </p>
        ) : (
          <p className="text-xs italic text-[color:var(--muted)] mb-1.5">내용 없음</p>
        )}
        {meal.calories != null && (
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-sm font-semibold tabular text-[var(--color-terra-600)] dark:text-[var(--color-terra-400)]">
              {meal.calories}
            </span>
            <span className="text-[10px] text-[color:var(--muted)]">kcal</span>
          </div>
        )}
      </div>

      <button
        onClick={() => onDelete(meal)}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md bg-white/90 dark:bg-black/60 hover:bg-[var(--color-wine-500)]/90 hover:text-white"
        aria-label="삭제"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}
