import type { UserProfile, ActivityLevel, MedicationRecord } from "@/types";

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

export function bmiCategory(bmi: number): { label: string; color: string } {
  if (bmi === 0) return { label: "-", color: "text-stone-400" };
  if (bmi < 18.5) return { label: "저체중", color: "text-blue-500" };
  if (bmi < 23) return { label: "정상", color: "text-emerald-500" };
  if (bmi < 25) return { label: "과체중", color: "text-yellow-500" };
  if (bmi < 30) return { label: "1단계 비만", color: "text-orange-500" };
  if (bmi < 35) return { label: "2단계 비만", color: "text-red-500" };
  return { label: "3단계 비만", color: "text-red-700" };
}

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

export function calculateDailyTarget(
  profile: UserProfile,
  currentWeight?: number
): number {
  const tdee = calculateTDEE(profile, currentWeight);
  const weeklyDeficit = profile.weeklyDeficitKcal ?? 3500;
  return Math.round(tdee - weeklyDeficit / 7);
}

// ⭐ 단백질 목표 계산
// GLP-1 + 저항운동 권장량: 체중 × 1.6 g/kg
// (Murphy 2023, ISSN guidelines)
export function calculateProteinTarget(
  profile: UserProfile,
  currentWeight?: number
): number {
  if (profile.proteinTargetG && profile.proteinTargetG > 0) {
    return profile.proteinTargetG;
  }
  const weight = currentWeight && currentWeight > 0 ? currentWeight : profile.startWeightKg;
  return Math.round(weight * 1.6);
}

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

// ============================================
// ⭐ 마운자로 도우미 함수
// ============================================

// 마운자로 용량 단계 (mg)
export const MOUNJARO_DOSES = [2.5, 5, 7.5, 10, 12.5, 15] as const;

// 부작용 증상 옵션
export const SIDE_EFFECT_SYMPTOMS = [
  "오심", "구토", "설사", "변비", "복통",
  "소화불량", "피로", "두통", "어지럼", "역류",
] as const;

// 다음 주사일 계산 (마지막 주사일 + 7일)
export function nextInjectionDate(
  records: MedicationRecord[]
): Date | null {
  if (records.length === 0) return null;
  const sorted = [...records].sort((a, b) =>
    b.injectionDate.localeCompare(a.injectionDate)
  );
  const last = new Date(sorted[0].injectionDate);
  last.setDate(last.getDate() + 7);
  return last;
}

// D-day 계산
export function daysBetween(target: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const t = new Date(target);
  t.setHours(0, 0, 0, 0);
  const diff = Math.round((t.getTime() - today.getTime()) / 86400000);
  return diff;
}

// 마운자로 시작 후 경과 주차
export function weeksSinceMedicationStart(startDate: string): number {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const today = new Date();
  const diff = Math.floor(
    (today.getTime() - start.getTime()) / (7 * 86400000)
  );
  return Math.max(0, diff);
}
