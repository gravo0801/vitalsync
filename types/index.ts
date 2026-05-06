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
  birthDate: string; // YYYY-MM-DD
  heightCm: number;
  startWeightKg: number;
  targetWeightKg: number;
  activityLevel: ActivityLevel;
  weeklyDeficitKcal?: number; // 기본 3500 (주 0.5kg 감량)
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
  duration: number; // 분
  type?: string; // 걷기, 달리기, 헬스 등
  caloriesBurned?: number;
  notes: string;
  createdAt: Timestamp;
}
