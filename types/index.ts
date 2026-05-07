import type { Timestamp } from "firebase/firestore";

export type Sex = "male" | "female";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "veryActive";

export type MealType = "아침" | "점심" | "저녁" | "간식";

export interface UserProfile {
  name?: string;
  sex: Sex;
  birthDate: string;
  heightCm: number;
  startWeightKg: number;
  targetWeightKg: number;
  activityLevel: ActivityLevel;
  weeklyDeficitKcal?: number;
  updatedAt?: Timestamp;
}

export interface WeightRecord {
  id: string;
  date: string;
  weight: number;
  memo?: string;
  createdAt: Timestamp;
}

export interface MealRecord {
  id: string;
  date: string;
  mealType: MealType;
  calories: number | null;
  content?: string;
  photoURL?: string;
  createdAt: Timestamp;
}

export interface WorkoutRecord {
  id: string;
  date: string;
  duration: number;
  type?: string;
  caloriesBurned?: number;
  notes: string;
  createdAt: Timestamp;
}

// ⭐ 인바디 측정 기록
export interface InbodyRecord {
  id: string;
  measuredAt: string; // YYYY-MM-DD
  weight?: number; // 체중 (kg)
  skeletalMuscleMass?: number; // 골격근량 (kg)
  bodyFatMass?: number; // 체지방량 (kg)
  bodyFatPercent?: number; // 체지방률 (%)
  bmi?: number;
  bmr?: number; // 기초대사량 (kcal)
  visceralFatLevel?: number; // 내장지방 레벨
  totalBodyWater?: number; // 체수분 (kg)
  protein?: number; // 단백질 (kg)
  minerals?: number; // 무기질 (kg)
  inbodyScore?: number; // 인바디 점수 (0-100)
  fileURL?: string; // 원본 사진/PDF
  notes?: string;
  createdAt: Timestamp;
}

// AI 분석 결과 (저장 전 임시)
export interface InbodyAnalysisResult {
  measuredAt: string | null;
  weight: number | null;
  skeletalMuscleMass: number | null;
  bodyFatMass: number | null;
  bodyFatPercent: number | null;
  bmi: number | null;
  bmr: number | null;
  visceralFatLevel: number | null;
  totalBodyWater: number | null;
  protein: number | null;
  minerals: number | null;
  inbodyScore: number | null;
}
