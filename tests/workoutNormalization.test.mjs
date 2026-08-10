import assert from "node:assert/strict";
import test from "node:test";

import { normalizeWorkoutRecord } from "../lib/workoutNormalization.ts";

test("시작·종료 시각이 세부 활동 합계보다 우선한다", () => {
  const workout = normalizeWorkoutRecord("workout-1", {
    date: "2026-07-26",
    duration: null,
    startedAt: "18:05",
    endedAt: "19:33",
    cardioExercises: [
      { exerciseName: "스트레칭", durationMin: 20 },
      { exerciseName: "러닝머신 걷기", durationMin: 30 },
    ],
  });

  assert.equal(workout.duration, 88);
  assert.equal(workout.durationSource, "timestamps");
  assert.equal(workout.durationDerivedFromCardio, false);
});

test("전체 시간이 없을 때만 시간 기반 활동 합계를 사용한다", () => {
  const workout = normalizeWorkoutRecord("workout-2", {
    date: "2026-07-26",
    cardioExercises: [
      { exerciseName: "스트레칭", durationMin: 20 },
      { exerciseName: "러닝머신 걷기", durationMin: 30 },
    ],
  });

  assert.equal(workout.duration, 50);
  assert.equal(workout.durationSource, "activities");
  assert.equal(workout.durationDerivedFromCardio, true);
});

test("활동 유형을 명시값 또는 기존 운동명에서 정규화한다", () => {
  const workout = normalizeWorkoutRecord("workout-3", {
    date: "2026-07-26",
    cardioExercises: [
      { exerciseName: "목·허리 스트레칭", durationMin: 20 },
      { exerciseName: "고관절 가동성", durationMin: 10 },
      {
        exerciseName: "가볍게 걷기",
        activityType: "cardio",
        durationMin: 30,
      },
    ],
  });

  assert.deepEqual(
    workout.cardioExercises?.map((exercise) => exercise.activityType),
    ["stretching", "mobility", "cardio"],
  );
});

test("추정 전체 시간은 활동 합계와 구분한다", () => {
  const workout = normalizeWorkoutRecord("workout-4", {
    date: "2026-07-26",
    duration: 75,
    durationEstimated: true,
    cardioExercises: [{ exerciseName: "러닝머신", durationMin: 30 }],
  });

  assert.equal(workout.duration, 75);
  assert.equal(workout.durationSource, "estimated");
});
