import type { Timestamp } from "firebase/firestore";

export type Sex = "male" | "female";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "veryActive";

export type MealType = "아침" | "점심" | "저녁" | "간식";

// ⭐ 마운자로 정보 (프로필 내에 통합)
export interface MedicationInfo {
  type: "mounjaro" | "ozempic" | "wegovy" | "other";
  startDate: string; // YYYY-MM-DD
  currentDoseMg: number; // 2.5, 5, 7.5, 10, 12.5, 15
  injectionDayOfWeek?: number; // 0=일, 1=월, ... (주사 요일)
}

export interface UserProfile {
  name?: string;
  sex: Sex;
  birthDate: string;
  heightCm: number;
  startWeightKg: number;
  targetWeightKg: number;
  activityLevel: ActivityLevel;
  weeklyDeficitKcal?: number;
  // ⭐ 단백질 목표 (g/일). 미설정 시 체중 × 1.6 자동 계산
  proteinTargetG?: number;
  // ⭐ 마운자로 정보
  medication?: MedicationInfo;
  updatedAt?: Timestamp;
}

export interface WeightRecord {
  id: string;
  date: string;
  weight: number;
  memo?: string;
  createdAt: Timestamp;
}

// ⭐ 식사 - 단백질 필드 추가
export interface MealRecord {
  id: string;
  date: string;
  mealType: MealType;
  calories: number | null;
  proteinG?: number | null; // ⭐ 단백질(g)
  content?: string;
  photoURL?: string;
  createdAt: Timestamp;
}

// ⭐ 운동 - PT 카테고리 + 부위 추가
export type WorkoutCategory = "cardio" | "pt" | "self_strength" | "etc";
export type BodyPart = "상체" | "하체" | "전신" | "코어";

export interface WorkoutRecord {
  id: string;
  date: string;
  duration: number;
  type?: string;
  category?: WorkoutCategory; // ⭐ PT vs 일반 운동 분리
  bodyPart?: BodyPart; // ⭐ PT일 때 부위
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

// ⭐ 마운자로 주사 기록
export interface MedicationRecord {
  id: string;
  injectionDate: string; // YYYY-MM-DD
  doseMg: number;
  // 부작용 강도 (0=없음, 5=심함)
  sideEffectScore?: number;
  // 식욕 억제 정도 (0=평소, 5=극단적)
  appetiteSuppressionScore?: number;
  // 주된 부작용 (체크박스)
  symptoms?: string[]; // ["오심", "변비", "두통", ...]
  notes?: string;
  createdAt: Timestamp;
}
