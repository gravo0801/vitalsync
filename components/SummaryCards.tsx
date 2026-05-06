"use client";
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
  profile, currentWeight, todayKcalIn, todayKcalBurned,
}: Props) {
  const bmi = calculateBMI(currentWeight, profile.heightCm);
  const cat = bmiCategory(bmi);
  const dailyTarget = calculateDailyTarget(profile, currentWeight);
  const remaining = dailyTarget - todayKcalIn + todayKcalBurned;
  const remainingColor =
    remaining < 0
      ? "text-[var(--color-wine-600)] dark:text-[var(--color-wine-400)]"
      : remaining < 300
      ? "text-[var(--color-terra-600)] dark:text-[var(--color-terra-400)]"
      : "text-[var(--color-sage-600)] dark:text-[var(--color-sage-400)]";

  const toGoal = currentWeight - profile.targetWeightKg;
  const eta = estimateTargetDate(currentWeight, profile.targetWeightKg, 0.5);
  const progressPct = profile.startWeightKg > profile.targetWeightKg
    ? Math.min(100, Math.max(0,
        ((profile.startWeightKg - currentWeight) /
          (profile.startWeightKg - profile.targetWeightKg)) * 100))
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
      {/* 현재 체중 / BMI */}
      <Card accentColor="sage">
        <CardLabel>현재 <span className="serif-italic">체중</span> · BMI</CardLabel>
        <div className="flex items-baseline gap-2 mt-3">
          <span className="text-3xl font-semibold tabular tracking-tight">
            {currentWeight ? currentWeight.toFixed(1) : "—"}
          </span>
          <span className="text-sm text-[color:var(--muted)]">kg</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-base font-medium tabular">{bmi ? bmi.toFixed(1) : "—"}</span>
          <span className={`text-xs ${cat.color}`}>{cat.label}</span>
        </div>
      </Card>

      {/* 목표 */}
      <Card accentColor="terra">
        <CardLabel>목표까지 <span className="serif-italic">남은 거리</span></CardLabel>
        <div className="flex items-baseline gap-2 mt-3">
          <span className="text-3xl font-semibold tabular tracking-tight">
            {toGoal > 0 ? toGoal.toFixed(1) : 0}
          </span>
          <span className="text-sm text-[color:var(--muted)]">kg</span>
        </div>
        <div className="text-xs text-[color:var(--muted)] mt-2">
          목표 {profile.targetWeightKg}kg
          {eta && (
            <>
              {" "}· 예상 도달{" "}
              <span className="text-[var(--color-terra-600)] dark:text-[var(--color-terra-400)]">
                {format(eta.date, "yy.MM.dd", { locale: ko })}
              </span>
            </>
          )}
        </div>
        <div className="progress-bar mt-3">
          <div
            className="h-full bg-[var(--color-terra-500)] transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </Card>

      {/* 잔여 칼로리 */}
      <Card accentColor={remaining < 0 ? "wine" : "sage"}>
        <CardLabel>오늘 <span className="serif-italic">잔여 칼로리</span></CardLabel>
        <div className="flex items-baseline gap-2 mt-3">
          <span className={`text-3xl font-semibold tabular tracking-tight ${remainingColor}`}>
            {remaining >= 0 ? remaining.toLocaleString() : `+${Math.abs(remaining).toLocaleString()}`}
          </span>
          <span className="text-sm text-[color:var(--muted)]">kcal</span>
        </div>
        <div className="text-xs text-[color:var(--muted)] mt-2 tabular">
          목표 {dailyTarget.toLocaleString()} · 섭취 {todayKcalIn.toLocaleString()}
          {todayKcalBurned > 0 && ` · 소모 ${todayKcalBurned.toLocaleString()}`}
        </div>
      </Card>
    </div>
  );
}

type AccentColor = "sage" | "terra" | "wine" | "slate-blue" | "mauve";

const ACCENT_COLOR_MAP: Record<AccentColor, string> = {
  sage: "var(--color-sage-500)",
  terra: "var(--color-terra-500)",
  wine: "var(--color-wine-500)",
  "slate-blue": "var(--color-slate-blue-500)",
  mauve: "var(--color-mauve-500)",
};

export function Card({
  children,
  accentColor,
  className = "",
}: {
  children: React.ReactNode;
  accentColor?: AccentColor;
  className?: string;
}) {
  return (
    <div
      className={`
        relative overflow-hidden
        bg-white dark:bg-[var(--color-ink-900)]
        border border-black/6 dark:border-white/6
        rounded-2xl p-5
        ${className}
      `}
      style={accentColor ? { ["--accent-color" as never]: ACCENT_COLOR_MAP[accentColor] } : undefined}
    >
      {accentColor && (
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: ACCENT_COLOR_MAP[accentColor] }}
        />
      )}
      {children}
    </div>
  );
}

export function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs text-[color:var(--muted)] tracking-wide">{children}</div>
  );
}
