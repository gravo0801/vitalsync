"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";

import { useProfile } from "@/hooks/useProfile";
import { useWeights } from "@/hooks/useWeights";
import { useMeals } from "@/hooks/useMeals";
import { useWorkouts } from "@/hooks/useWorkouts";

import Header from "@/components/Header";
import SummaryCards from "@/components/SummaryCards";
import WeightChart from "@/components/WeightChart";
import RecentRecords from "@/components/RecentRecords";
import Calendar from "@/components/Calendar";

import WeightModal from "@/components/modals/WeightModal";
import MealModal from "@/components/modals/MealModal";
import WorkoutModal from "@/components/modals/WorkoutModal";
import DayDetailModal from "@/components/modals/DayDetailModal";

export default function Dashboard() {
  const router = useRouter();
  const { profile, loading: pLoading } = useProfile();
  const { weights, loading: wLoading, addWeight, deleteWeight } = useWeights();
  const { meals, loading: mLoading, addMeal, deleteMeal } = useMeals();
  const { workouts, loading: woLoading, addWorkout, deleteWorkout } = useWorkouts();

  const [weightOpen, setWeightOpen] = useState(false);
  const [mealOpen, setMealOpen] = useState(false);
  const [workoutOpen, setWorkoutOpen] = useState(false);
  const [dayOpen, setDayOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const loading = pLoading || wLoading || mLoading || woLoading;

  // 현재 체중 (가장 최근 기록)
  const currentWeight = useMemo(() => {
    if (weights.length === 0) return profile?.startWeightKg ?? 0;
    const sorted = [...weights].sort((a, b) => b.date.localeCompare(a.date));
    return sorted[0].weight;
  }, [weights, profile]);

  // 오늘 칼로리
  const today = format(new Date(), "yyyy-MM-dd");
  const todayKcalIn = meals
    .filter((m) => m.date === today)
    .reduce((s, m) => s + (m.calories || 0), 0);
  const todayKcalBurned = workouts
    .filter((w) => w.date === today)
    .reduce((s, w) => s + (w.caloriesBurned || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-stone-500 dark:text-zinc-400">로딩 중...</div>
      </div>
    );
  }

  // 프로필 없으면 안내
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span className="text-white font-bold text-3xl">V</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">VitalSync에 오신 것을 환영합니다</h1>
          <p className="text-stone-500 dark:text-zinc-400 mb-6">
            맞춤 칼로리 목표를 위해 먼저 기본 정보를 입력해주세요.
          </p>
          <Link
            href="/profile"
            className="inline-block px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
          >
            프로필 설정하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        onAddWeight={() => setWeightOpen(true)}
        onAddMeal={() => setMealOpen(true)}
        onAddWorkout={() => setWorkoutOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <p className="text-stone-500 dark:text-zinc-400">
            안녕하세요, {profile.name || "그라보"}님 👋
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-1">
            오늘도 좋은 하루 되세요
          </h2>
        </div>

        <SummaryCards
          profile={profile}
          currentWeight={currentWeight}
          todayKcalIn={todayKcalIn}
          todayKcalBurned={todayKcalBurned}
        />

        <WeightChart weights={weights} targetWeight={profile.targetWeightKg} />

        <RecentRecords
          weights={weights}
          meals={meals}
          onDeleteWeight={deleteWeight}
          onDeleteMeal={deleteMeal}
        />

        <Calendar
          weights={weights}
          meals={meals}
          workouts={workouts}
          onSelectDate={(d) => {
            setSelectedDate(d);
            setDayOpen(true);
          }}
        />
      </main>

      {/* 모달들 */}
      <WeightModal
        open={weightOpen}
        onClose={() => setWeightOpen(false)}
        defaultDate={selectedDate || undefined}
        onSave={addWeight}
      />

      <MealModal
        open={mealOpen}
        onClose={() => setMealOpen(false)}
        defaultDate={selectedDate || undefined}
        onSave={addMeal}
      />

      <WorkoutModal
        open={workoutOpen}
        onClose={() => setWorkoutOpen(false)}
        defaultDate={selectedDate || undefined}
        onSave={addWorkout}
      />

      <DayDetailModal
        open={dayOpen}
        onClose={() => setDayOpen(false)}
        date={selectedDate}
        weights={weights}
        meals={meals}
        workouts={workouts}
        onAddWeight={() => {
          setDayOpen(false);
          setWeightOpen(true);
        }}
        onAddMeal={() => {
          setDayOpen(false);
          setMealOpen(true);
        }}
        onAddWorkout={() => {
          setDayOpen(false);
          setWorkoutOpen(true);
        }}
        onDeleteWeight={deleteWeight}
        onDeleteMeal={deleteMeal}
        onDeleteWorkout={deleteWorkout}
      />
    </div>
  );
}
