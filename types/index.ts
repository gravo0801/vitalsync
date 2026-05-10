import type { Timestamp } from "firebase/firestore";

export type Sex = "male" | "female";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "veryActive";

export type MealType = "아침" | "점심" | "저녁" | "간식";

// ⭐ 운동 대분류
export type WorkoutCategory = "PT" | "personal";

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
  photoURL?: string | null;
  createdAt: Timestamp;
}

export interface WorkoutRecord {
  id: string;
  date: string;
  duration: number;
  type?: string; // 걷기, 달리기, 헬스 등
  category?: WorkoutCategory; // ⭐ PT or 개인운동
  ptNumber?: number; // ⭐ PT 회차를 수동 지정 시 저장 (없으면 자동 계산)
  lessonContent?: string; // ⭐ 오늘 PT에서 무슨 수업/운동을 했는지
  caloriesBurned?: number;
  notes: string;
  createdAt: Timestamp;
}

export interface InbodyRecord {
  id: string;
  measuredAt: string;
  weight?: number;
  skeletalMuscleMass?: number;
  bodyFatMass?: number;
  bodyFatPercent?: number;
  bmi?: number;
  bmr?: number;
  visceralFatLevel?: number;
  totalBodyWater?: number;
  protein?: number;
  minerals?: number;
  inbodyScore?: number;
  fileURL?: string;
  notes?: string;
  createdAt: Timestamp;
}

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

// ⭐ 통합 체중 추이용 - 체중기록 + 인바디 측정 합쳐서 timeline
export interface CombinedWeightPoint {
  date: string;
  weight: number;
  source: "weight" | "inbody";
  recordId: string;
}

// 운동에 동적 PT 회차 부여
export interface WorkoutWithPtNumber extends WorkoutRecord {
  ptNumber?: number;
}

// ⭐ Mounjaro (티르제파티드) 주간 주사 기록
export type InjectionSite = "abdomen" | "thigh" | "upper_arm";
export const MOUNJARO_DOSES = [2.5, 5, 7.5, 10, 12.5, 15] as const;
export type MounjaroDose = (typeof MOUNJARO_DOSES)[number];

export interface MedicationRecord {
  id: string;
  date: string; // YYYY-MM-DD (주사일)
  medicationType: "mounjaro";
  doseMg: MounjaroDose;
  injectionSite?: InjectionSite | null;
  sideEffects?: string;
  appetiteSuppression?: number | null;
  nauseaLevel?: number | null;
  constipation?: boolean;
  diarrhea?: boolean;
  fatigue?: boolean;
  weightKgAtInjection?: number | null;
  createdAt: Timestamp;
}
