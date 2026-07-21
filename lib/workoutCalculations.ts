import type {
  StrengthSet,
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

const STRENGTH_TYPES = new Set(["헬스", "홈트", "근력", "복합"]);

export function isStrengthWorkout(type: string): boolean {
  return STRENGTH_TYPES.has(type);
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
  return (set.weightKg ?? 0) * set.reps;
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
    (sum, exercise) => sum + exercise.sets.reduce((setSum, set) => setSum + set.reps, 0),
    0,
  );
}

export function summarizeSets(sets: StrengthSet[]): string {
  const grouped = new Map<string, { weightKg: number | null; reps: number; count: number }>();

  sets.forEach((set) => {
    const key = `${set.weightKg ?? "bodyweight"}:${set.reps}`;
    const current = grouped.get(key);
    if (current) current.count += 1;
    else grouped.set(key, { ...set, count: 1 });
  });

  return [...grouped.values()]
    .map(({ weightKg, reps, count }) => {
      const load = weightKg == null ? "체중" : `${weightKg}kg`;
      return `${load} × ${reps}회 × ${count}세트`;
    })
    .join(" / ");
}
