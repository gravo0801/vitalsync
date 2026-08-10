import type {
  WorkoutActivityType,
  WorkoutDurationSource,
  WorkoutRecord,
} from "@/types";

export const ACTIVITY_TYPE_LABEL: Record<WorkoutActivityType, string> = {
  cardio: "유산소",
  stretching: "스트레칭",
  mobility: "모빌리티",
};

export function workoutDurationDisplay(workout: WorkoutRecord): {
  label: string;
  value: string;
  suffix: string;
} {
  const source: WorkoutDurationSource =
    workout.durationSource ??
    (workout.durationDerivedFromCardio ? "activities" : "explicit");
  const value = workout.duration > 0 ? `${workout.duration}분` : "미기록";

  switch (source) {
    case "estimated":
      return { label: "추정 운동시간", value, suffix: " (추정)" };
    case "timestamps":
      return { label: "운동시간", value, suffix: "" };
    case "activities":
      return { label: "기록된 활동 합계", value, suffix: " (활동 합계)" };
    case "missing":
      return { label: "운동시간", value: "미기록", suffix: "" };
    default:
      return { label: "운동시간", value, suffix: "" };
  }
}
