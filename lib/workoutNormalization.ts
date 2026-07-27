import type { DocumentData } from "firebase/firestore";

import type {
  StrengthSet,
  WorkoutActivityType,
  WorkoutCardioExercise,
  WorkoutDurationSource,
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

function normalizeActivityType(
  value: unknown,
  exerciseName: string,
): WorkoutActivityType {
  const declaredType = asString(value)?.toLocaleLowerCase();
  if (
    declaredType === "cardio" ||
    declaredType === "stretching" ||
    declaredType === "mobility"
  ) {
    return declaredType;
  }

  const normalizedName = exerciseName.toLocaleLowerCase().replace(/[\s_-]+/gu, "");
  if (
    ["스트레칭", "스트레치", "stretch", "몸풀기", "목풀기", "허리풀기"].some(
      (keyword) => normalizedName.includes(keyword),
    )
  ) {
    return "stretching";
  }
  if (
    ["모빌리티", "mobility", "가동성"].some((keyword) =>
      normalizedName.includes(keyword),
    )
  ) {
    return "mobility";
  }
  return "cardio";
}

function durationFromTimestamps(
  startedAt: string | undefined,
  endedAt: string | undefined,
  date: string,
): number | null {
  if (!startedAt || !endedAt) return null;

  const parseDateTime = (value: string) => {
    const candidate = /^\d{1,2}:\d{2}$/u.test(value)
      ? `${date}T${value}:00`
      : value;
    const parsed = Date.parse(candidate);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const start = parseDateTime(startedAt);
  let end = parseDateTime(endedAt);
  if (start == null || end == null) return null;

  if (end < start && /^\d{1,2}:\d{2}$/u.test(startedAt) && /^\d{1,2}:\d{2}$/u.test(endedAt)) {
    end += 24 * 60 * 60 * 1000;
  }

  const durationMin = Math.round((end - start) / 60_000);
  return durationMin > 0 && durationMin <= 24 * 60 ? durationMin : null;
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
    activityType: normalizeActivityType(
      exercise.activityType ?? exercise.kind ?? exercise.category,
      name,
    ),
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
  const date = asString(data.date) ?? "";
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
  const activityDuration = cardioExercises.reduce(
    (sum, exercise) => sum + (exercise.durationMin ?? 0),
    0,
  );
  const startedAt = asString(data.startedAt);
  const endedAt = asString(data.endedAt);
  const timestampDuration = durationFromTimestamps(startedAt, endedAt, date);
  const hasExplicitDuration = explicitDuration != null && explicitDuration > 0;
  const duration = hasExplicitDuration
    ? explicitDuration
    : timestampDuration ?? activityDuration;
  const durationSource: WorkoutDurationSource = hasExplicitDuration
    ? data.durationEstimated === true
      ? "estimated"
      : "explicit"
    : timestampDuration != null
      ? "timestamps"
      : activityDuration > 0
        ? "activities"
        : "missing";

  return {
    ...(data as WorkoutRecord),
    id,
    date,
    duration,
    durationEstimated: data.durationEstimated === true,
    startedAt: startedAt ?? null,
    endedAt: endedAt ?? null,
    durationSource,
    durationDerivedFromCardio: durationSource === "activities",
    exercises: directExercises.length > 0 ? directExercises : legacyExercises,
    cardioExercises,
    notes: asString(data.notes) ?? "",
  };
}
