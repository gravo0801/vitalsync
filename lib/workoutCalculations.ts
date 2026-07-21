import type {
  StrengthSet,
  WorkoutCardioExercise,
  WorkoutExercise,
  WorkoutIntensity,
} from "@/types";

export const STRENGTH_MET: Record<WorkoutIntensity, number> = {
  light: 3.0,
  moderate: 3.5,
  vigorous: 6.0,
};

export const INTENSITY_LABEL: Record<WorkoutIntensity, string> = {
  light: "가볍게",
  moderate: "보통",
  vigorous: "고강도",
};

const GENERAL_MET: Record<string, number> = {
  걷기: 3.5,
  달리기: 8.0,
  자전거: 6.0,
  수영: 7.0,
  유산소: 7.0,
  코어: 3.8,
  스트레칭: 2.3,
  기타: 4.0,
};

const STRENGTH_TYPES = ["헬스", "홈트", "근력", "복합"];

export function isStrengthWorkout(type: string): boolean {
  return STRENGTH_TYPES.some((keyword) => type.includes(keyword));
}

export function workoutMet(type: string, intensity: WorkoutIntensity): number {
  if (isStrengthWorkout(type)) return STRENGTH_MET[intensity];
  return GENERAL_MET[type] ?? 4.0;
}

export function estimateWorkoutCalories({
  bodyWeightKg,
  durationMin,
  type,
  intensity,
}: {
  bodyWeightKg: number;
  durationMin: number;
  type: string;
  intensity: WorkoutIntensity;
}): { calories: number; met: number } {
  const met = workoutMet(type, intensity);
  const calories = Math.round((met * bodyWeightKg * durationMin) / 60);
  return { calories, met };
}

export function calculateSetVolume(set: StrengthSet): number {
  const load =
    set.weightKg ??
    ((set.machineBaseWeightKg ?? 0) + (set.addedWeightKg ?? 0) || 0);
  return load * (set.reps ?? 0);
}

export function calculateExerciseVolume(exercise: WorkoutExercise): number {
  return exercise.sets.reduce((sum, set) => sum + calculateSetVolume(set), 0);
}

export function calculateWorkoutVolume(exercises: WorkoutExercise[] = []): number {
  return exercises.reduce((sum, exercise) => sum + calculateExerciseVolume(exercise), 0);
}

export function totalWorkoutSets(exercises: WorkoutExercise[] = []): number {
  return exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
}

export function totalWorkoutReps(exercises: WorkoutExercise[] = []): number {
  return exercises.reduce(
    (sum, exercise) => sum + exercise.sets.reduce((setSum, set) => setSum + (set.reps ?? 0), 0),
    0,
  );
}

export function setLoadLabel(set: StrengthSet): string {
  if (set.weightKg != null) {
    return `${set.weightKg}kg${set.estimated ? "(추정)" : ""}`;
  }

  const parts: string[] = [];
  if (set.machineBaseWeightKg != null) {
    parts.push(`기본 ${set.machineBaseWeightKg}kg${set.machineBaseWeightEstimated ? "(추정)" : ""}`);
  }
  if (set.addedWeightKg != null) parts.push(`원판 ${set.addedWeightKg}kg`);
  return parts.length > 0 ? parts.join(" + ") : "체중";
}

export function setRepsLabel(set: StrengthSet): string {
  return set.reps == null ? "횟수 미기록" : `${set.reps}회`;
}

export function formatStrengthSet(set: StrengthSet): string {
  return `${setLoadLabel(set)} × ${setRepsLabel(set)}`;
}

export function summarizeSets(sets: StrengthSet[]): string {
  const grouped = new Map<string, { set: StrengthSet; count: number }>();

  sets.forEach((set) => {
    const key = [
      set.weightKg ?? "bodyweight",
      set.machineBaseWeightKg ?? "no-base",
      set.addedWeightKg ?? "no-added",
      set.machineBaseWeightEstimated ? "estimated-base" : "exact-base",
      set.estimated ? "estimated" : "exact",
      set.reps ?? "unknown-reps",
    ].join(":");
    const current = grouped.get(key);
    if (current) current.count += 1;
    else grouped.set(key, { set, count: 1 });
  });

  return [...grouped.values()]
    .map(({ set, count }) => `${formatStrengthSet(set)} × ${count}세트`)
    .join(" / ");
}

export function summarizeCardio(exercise: WorkoutCardioExercise): string {
  const details: string[] = [];
  if (exercise.durationMin != null) details.push(`${exercise.durationMin}분`);
  if (exercise.speedKmh != null) details.push(`${exercise.speedKmh}km/h`);
  if (exercise.distanceKm != null) details.push(`${exercise.distanceKm}km`);
  if (exercise.inclinePercent != null) details.push(`경사 ${exercise.inclinePercent}%`);
  return details.length > 0 ? details.join(" · ") : "상세 미기록";
}
