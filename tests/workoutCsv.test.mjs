import assert from "node:assert/strict";
import test from "node:test";

import { buildWorkoutCsv } from "../lib/workoutCsv.ts";

const timestamp = (value) => ({ toMillis: () => value });

test("운동 기록을 최신순 한글 CSV로 만든다", () => {
  const csv = buildWorkoutCsv([
    {
      id: "workout-1",
      date: "2026-08-20",
      duration: 30,
      category: "personal",
      notes: "가볍게 진행",
      createdAt: timestamp(1),
    },
    {
      id: "workout-2",
      date: "2026-08-24",
      duration: 40,
      category: "PT",
      type: "헬스",
      ptNumber: 12,
      caloriesBurned: 320,
      intensity: "moderate",
      lessonContent: "하체, 코어",
      notes: "무릎 통증 없음",
      exercises: [
        {
          id: "exercise-1",
          name: "Leg extension",
          sets: [{ weightKg: 30, reps: 15, notes: "마지막 3회 힘듦" }],
        },
      ],
      cardioExercises: [
        {
          id: "cardio-1",
          name: "러닝머신 걷기",
          activityType: "cardio",
          durationMin: 15,
          speedKmh: 5,
        },
      ],
      createdAt: timestamp(2),
    },
  ]);

  assert.equal(csv.charCodeAt(0), 0xfeff);
  assert.ok(csv.indexOf("2026-08-24") < csv.indexOf("2026-08-20"));
  assert.match(csv, /"PT"/);
  assert.match(csv, /"Leg extension: 30kg × 15회 \(마지막 3회 힘듦\)"/);
  assert.match(csv, /"러닝머신 걷기: 15분 · 5km\/h"/);
  assert.match(csv, /"하체, 코어"/);
});

test("CSV 셀의 큰따옴표를 안전하게 이스케이프한다", () => {
  const csv = buildWorkoutCsv([
    {
      id: "workout-1",
      date: "2026-08-24",
      duration: 20,
      category: "personal",
      notes: '메모에 "따옴표" 포함',
      createdAt: timestamp(1),
    },
  ]);

  assert.match(csv, /"메모에 ""따옴표"" 포함"/);
});

