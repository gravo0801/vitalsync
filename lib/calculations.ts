import type { UserProfile, ActivityLevel } from "@/types";

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
};

export const ACTIVITY_LABEL: Record<ActivityLevel, string> = {
  sedentary: "좌식 (운동 거의 없음)",
  light: "가벼운 활동 (주 1~3회)",
  moderate: "중간 활동 (주 3~5회)",
  active: "활동적 (주 6~7회)",
  veryActive: "매우 활동적 (격렬한 운동)",
};

export function calculateAge(birthDate: string): number {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function calculateBMI(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm) return 0;
  const m = heightCm / 100;
  return weightKg / (m * m);
}

// 한국 기준(아시아-태평양 기준) BMI 분류
export function bmiCategory(bmi: number): { label: string; color: string } {
  if (bmi === 0) return { label: "-", color: "text-stone-400" };
  if (bmi < 18.5) return { label: "저체중", color: "text-blue-500" };
  if (bmi < 23) return { label: "정상", color: "text-emerald-500" };
  if (bmi < 25) return { label: "과체중", color: "text-yellow-500" };
  if (bmi < 30) return { label: "1단계 비만", color: "text-orange-500" };
  if (bmi < 35) return { label: "2단계 비만", color: "text-red-500" };
  return { label: "3단계 비만", color: "text-red-700" };
}

// Mifflin-St Jeor 공식
export function calculateBMR(profile: UserProfile, currentWeight?: number): number {
  const age = calculateAge(profile.birthDate);
  const weight = currentWeight && currentWeight > 0 ? currentWeight : profile.startWeightKg;
  const base = 10 * weight + 6.25 * profile.heightCm - 5 * age;
  return profile.sex === "male" ? base + 5 : base - 161;
}

export function calculateTDEE(profile: UserProfile, currentWeight?: number): number {
  const bmr = calculateBMR(profile, currentWeight);
  return bmr * ACTIVITY_MULTIPLIER[profile.activityLevel];
}

// 일일 칼로리 목표 (TDEE - 적자)
export function calculateDailyTarget(
  profile: UserProfile,
  currentWeight?: number
): number {
  const tdee = calculateTDEE(profile, currentWeight);
  const weeklyDeficit = profile.weeklyDeficitKcal ?? 3500; // 0.5kg/주
  return Math.round(tdee - weeklyDeficit / 7);
}

// 7일 이동평균
export function movingAverage(
  weights: { date: string; weight: number }[],
  window = 7
): { date: string; weight: number; avg: number | null }[] {
  return weights.map((w, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = weights.slice(start, i + 1);
    const avg = slice.reduce((s, x) => s + x.weight, 0) / slice.length;
    return { date: w.date, weight: w.weight, avg: i + 1 >= window ? avg : null };
  });
}

// 목표 도달 예상일 (현재 추세 기반)
export function estimateTargetDate(
  currentWeight: number,
  targetWeight: number,
  weeklyLossKg: number = 0.5
): { weeks: number; date: Date } | null {
  if (!currentWeight || !targetWeight || currentWeight <= targetWeight) return null;
  const weeks = Math.ceil((currentWeight - targetWeight) / weeklyLossKg);
  const date = new Date();
  date.setDate(date.getDate() + weeks * 7);
  return { weeks, date };
}
