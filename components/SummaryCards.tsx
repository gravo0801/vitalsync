"use client";
import { TrendingDown, Target, Flame } from "lucide-react";
import {
  calculateBMI,
  bmiCategory,
  calculateDailyTarget,
  estimateTargetDate,
} from "@/lib/calculations";
import type { UserProfile } from "@/types";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface Props {
  profile: UserProfile;
  currentWeight: number;
  todayKcalIn: number;
  todayKcalBurned: number;
}

export default function SummaryCards({
  profile,
  currentWeight,
  todayKcalIn,
  todayKcalBurned,
}: Props) {
  const bmi = calculateBMI(currentWeight, profile.heightCm);
  const cat = bmiCategory(bmi);
  const dailyTarget = calculateDailyTarget(profile, currentWeight);
  const remaining = dailyTarget - todayKcalIn + todayKcalBurned;
  const remainingColor =
    remaining < 0
      ? "text-red-500"
      : remaining < 300
      ? "text-yellow-500"
      : "text-emerald-500";

  const toGoal = currentWeight - profile.targetWeightKg;
  const eta = estimateTargetDate(currentWeight, profile.targetWeightKg, 0.5);

  const cardClass =
    "rounded-3xl p-6 bg-white dark:bg-zinc-900 border border-amber-200 dark:border-zinc-800 shadow-sm";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* BMI 카드 */}
      <div className={cardClass}>
        <div className="flex items-center gap-3 text-emerald-500 mb-2">
          <TrendingDown className="w-5 h-5" />
          <span className="text-sm font-medium">현재 체중 / BMI</span>
        </div>
        <div className="text-4xl font-semibold tracking-tighter">
          {currentWeight ? currentWeight.toFixed(1) : "-"} kg
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-2xl font-semibold">
            {bmi ? bmi.toFixed(1) : "-"}
          </span>
          <span className={`text-sm font-medium ${cat.color}`}>{cat.label}</span>
        </div>
      </div>

      {/* 목표 카드 */}
      <div className={cardClass}>
        <div className="flex items-center gap-3 text-blue-500 mb-2">
          <Target className="w-5 h-5" />
          <span className="text-sm font-medium">목표까지</span>
        </div>
        <div className="text-4xl font-semibold tracking-tighter">
          {toGoal > 0 ? toGoal.toFixed(1) : 0} kg
        </div>
        <p className="text-stone-500 dark:text-zinc-400 text-sm mt-2">
          목표: {profile.targetWeightKg} kg
          {eta && (
            <>
              {" "}
              · 예상 도달{" "}
              <span className="text-blue-500">
                {format(eta.date, "yyyy.MM.dd", { locale: ko })}
              </span>
            </>
          )}
        </p>
      </div>

      {/* 일일 칼로리 카드 */}
      <div className={cardClass}>
        <div className="flex items-center gap-3 text-orange-500 mb-2">
          <Flame className="w-5 h-5" />
          <span className="text-sm font-medium">오늘 잔여 칼로리</span>
        </div>
        <div className={`text-4xl font-semibold tracking-tighter ${remainingColor}`}>
          {remaining >= 0 ? remaining : `+${Math.abs(remaining)}`} kcal
        </div>
        <p className="text-stone-500 dark:text-zinc-400 text-sm mt-2">
          목표 {dailyTarget.toLocaleString()} · 섭취 {todayKcalIn.toLocaleString()}
          {todayKcalBurned > 0 && ` · 소모 ${todayKcalBurned.toLocaleString()}`}
        </p>
      </div>
    </div>
  );
}
