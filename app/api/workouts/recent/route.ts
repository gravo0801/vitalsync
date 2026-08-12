import { NextRequest, NextResponse } from "next/server";

import { isWorkoutApiAuthorized, workoutApiUnauthorizedResponse } from "@/lib/workoutApiAuth";
import { workoutApiErrorResponse } from "@/lib/workoutApiResponses";
import { listWorkoutRecords, workoutApiPayload } from "@/lib/workoutRepository";

export const dynamic = "force-dynamic";

function parseLimit(request: NextRequest): number {
  const parsed = Number(request.nextUrl.searchParams.get("limit") ?? 5);
  return Number.isFinite(parsed) ? Math.min(20, Math.max(1, Math.trunc(parsed))) : 5;
}

export async function GET(request: NextRequest) {
  if (!isWorkoutApiAuthorized(request)) return workoutApiUnauthorizedResponse();

  try {
    const workouts = await listWorkoutRecords();
    const limit = parseLimit(request);
    const recentSessions = workouts.slice(0, limit);
    const latestExercises = new Map<string, unknown>();

    workouts.forEach((workout) => {
      workout.exercises?.forEach((exercise) => {
        const key = exercise.name.trim().toLocaleLowerCase();
        if (!latestExercises.has(key)) {
          latestExercises.set(key, {
            exerciseName: exercise.name,
            date: workout.date,
            workoutId: workout.id,
            sets: exercise.sets,
            detailUrl: `${request.nextUrl.origin}/workouts/${workout.id}`,
          });
        }
      });
    });

    return NextResponse.json({
      ok: true,
      count: recentSessions.length,
      recentSessions: recentSessions.map((workout) => workoutApiPayload(workout, request.nextUrl.origin)),
      latestExercises: [...latestExercises.values()],
    });
  } catch (error) {
    console.error("[GET /api/workouts/recent]", error);
    return workoutApiErrorResponse(
      "INTERNAL_ERROR",
      "최근 운동 기록을 불러오지 못했습니다.",
      500,
    );
  }
}
