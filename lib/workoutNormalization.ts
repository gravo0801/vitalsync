import type { DocumentData } from "firebase/firestore";

import type {
  StrengthSet,
  WorkoutCardioExercise,
  WorkoutExercise,
  WorkoutRecord,
} from "@/types";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeSet(value: unknown, index: number): StrengthSet | null {
  const set = asRecord(value);
  if (!set) return null;

  const weightKg = asNumber(set.weightKg);
  const reps = asNumber(set.reps);
  const addedWeightKg = asNumber(set.addedWeightKg);
  const machineBaseWeightKg = asNumber(set.machineBaseWeightKg);

  if (weightKg == null && reps == null && addedWeightKg == null && machineBaseWeightKg == null) {
    return null;
  }

  return {
    weightKg,
    reps,
    setNumber: asNumber(set.setNumber) ?? index + 1,
    addedWeightKg,
    machineBaseWeightKg,
    machineBaseWeightEstimated: set.machineBaseWeightEstimated === true,
    estimated: set.estimated === true,
    notes: asString(set.notes),
  };
}

function normalizeExercise(value: unknown, index: number): WorkoutExercise | null {
  const exercise = asRecord(value);
  if (!exercise) return null;

  const name = asString(exercise.name) ?? asString(exercise.exerciseName) ?? asString(exercise.originalName);
  if (!name) return null;

  const rawSets = Array.isArray(exercise.sets) ? exercise.sets : [];
  const sets = rawSets
    .map((set, setIndex) => normalizeSet(set, setIndex))
    .filter((set): set is StrengthSet => set != null);

  if (sets.length === 0) return null;

  return {
    id:
      asString(exercise.id) ??
      asString(exercise.canonicalExerciseId) ??
      `strength-${index + 1}`,
    name,
    sets,
    notes: asString(exercise.notes),
  };
}

function normalizeCardio(value: unknown, index: number): WorkoutCardioExercise | null {
  const exercise = asRecord(value);
  if (!exercise) return null;

  const name = asString(exercise.name) ?? asString(exercise.exerciseName) ?? asString(exercise.originalName);
  if (!name) return null;

  return {
    id:
      asString(exercise.id) ??
      asString(exercise.canonicalExerciseId) ??
      `cardio-${index + 1}`,
    name,
    durationMin: asNumber(exercise.durationMin),
    speedKmh: asNumber(exercise.speedKmh),
    distanceKm: asNumber(exercise.distanceKm),
    inclinePercent: asNumber(exercise.inclinePercent),
    estimated: exercise.estimated === true,
    notes: asString(exercise.notes),
  };
}

/**
 * GPT 자동화의 기존 strengthExercises/cardioExercises 스키마와
 * 앱의 exercises 스키마를 하나의 화면 모델로 합친다.
 */
export function normalizeWorkoutRecord(id: string, data: DocumentData): WorkoutRecord {
  const directExercises = Array.isArray(data.exercises)
    ? data.exercises
        .map((exercise: unknown, index: number) => normalizeExercise(exercise, index))
        .filter((exercise: WorkoutExercise | null): exercise is WorkoutExercise => exercise != null)
    : [];

  const legacyExercises = Array.isArray(data.strengthExercises)
    ? data.strengthExercises
        .map((exercise: unknown, index: number) => normalizeExercise(exercise, index))
        .filter((exercise: WorkoutExercise | null): exercise is WorkoutExercise => exercise != null)
    : [];

  const cardioExercises = Array.isArray(data.cardioExercises)
    ? data.cardioExercises
        .map((exercise: unknown, index: number) => normalizeCardio(exercise, index))
        .filter(
          (exercise: WorkoutCardioExercise | null): exercise is WorkoutCardioExercise => exercise != null,
        )
    : [];

  const explicitDuration = asNumber(data.duration);
  const cardioDuration = cardioExercises.reduce(
    (sum, exercise) => sum + (exercise.durationMin ?? 0),
    0,
  );
  const duration = explicitDuration != null && explicitDuration > 0 ? explicitDuration : cardioDuration;

  return {
    ...(data as WorkoutRecord),
    id,
    date: asString(data.date) ?? "",
    duration,
    durationDerivedFromCardio: !(explicitDuration != null && explicitDuration > 0) && cardioDuration > 0,
    exercises: directExercises.length > 0 ? directExercises : legacyExercises,
    cardioExercises,
    notes: asString(data.notes) ?? "",
  };
}
