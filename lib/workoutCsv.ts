import type {
  StrengthSet,
  WorkoutCardioExercise,
  WorkoutExercise,
  WorkoutWithPtNumber,
} from "../types";

const CSV_HEADERS = [
  "운동일자",
  "구분",
  "운동종류",
  "운동시간(분)",
  "시간 산정 방식",
  "강도",
  "소모칼로리(kcal)",
  "근력운동 상세",
  "유산소·스트레칭 상세",
  "PT 회차",
  "수업내용",
  "메모",
] as const;

const INTENSITY_LABELS = {
  light: "가볍게",
  moderate: "보통",
  vigorous: "고강도",
} as const;

function csvCell(value: unknown): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function setLoad(set: StrengthSet): string {
  if (set.weightKg != null) return `${set.weightKg}kg`;

  const machineLoad = [
    set.machineBaseWeightKg != null ? `기본 ${set.machineBaseWeightKg}kg` : "",
    set.addedWeightKg != null ? `원판 ${set.addedWeightKg}kg` : "",
  ].filter(Boolean);
  return machineLoad.length > 0 ? machineLoad.join(" + ") : "체중";
}

function formatStrengthExercise(exercise: WorkoutExercise): string {
  const sets = exercise.sets
    .map((set) => {
      const performance = `${setLoad(set)} × ${set.reps == null ? "횟수 미기록" : `${set.reps}회`}`;
      return set.notes?.trim() ? `${performance} (${set.notes.trim()})` : performance;
    })
    .join(" / ");
  const detail = [exercise.name, sets].filter(Boolean).join(": ");
  return exercise.notes?.trim() ? `${detail} [${exercise.notes.trim()}]` : detail;
}

function formatCardioExercise(exercise: WorkoutCardioExercise): string {
  const details = [
    exercise.durationMin != null ? `${exercise.durationMin}분` : "",
    exercise.speedKmh != null ? `${exercise.speedKmh}km/h` : "",
    exercise.distanceKm != null ? `${exercise.distanceKm}km` : "",
    exercise.inclinePercent != null ? `경사 ${exercise.inclinePercent}%` : "",
  ].filter(Boolean);
  const summary = [exercise.name, details.join(" · ")].filter(Boolean).join(": ");
  return exercise.notes?.trim() ? `${summary} [${exercise.notes.trim()}]` : summary;
}

function durationSource(workout: WorkoutWithPtNumber): string {
  return workout.durationDerivedFromCardio ? "세부 활동 합계" : "기록된 총시간";
}

export function buildWorkoutCsv(workouts: WorkoutWithPtNumber[]): string {
  const rows = [...workouts]
    .sort((a, b) => {
      const dateOrder = b.date.localeCompare(a.date);
      if (dateOrder !== 0) return dateOrder;
      return (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0);
    })
    .map((workout) => [
      workout.date,
      workout.category === "PT" ? "PT" : "개인 운동",
      workout.type || "운동",
      workout.duration,
      durationSource(workout),
      workout.intensity ? INTENSITY_LABELS[workout.intensity] : "",
      workout.caloriesBurned,
      (workout.exercises ?? []).map(formatStrengthExercise).join(" | "),
      (workout.cardioExercises ?? []).map(formatCardioExercise).join(" | "),
      workout.ptNumber,
      workout.lessonContent,
      workout.notes,
    ]);

  return `\uFEFF${[CSV_HEADERS, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n")}`;
}

