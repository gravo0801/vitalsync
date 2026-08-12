import { NextRequest, NextResponse } from "next/server";

import { isWorkoutApiAuthorized, workoutApiUnauthorizedResponse } from "@/lib/workoutApiAuth";
import { workoutApiErrorResponse } from "@/lib/workoutApiResponses";
import {
  listWorkoutRecords,
  saveConfirmedWorkout,
  workoutApiPayload,
  type WorkoutSavePayload,
} from "@/lib/workoutRepository";

export const dynamic = "force-dynamic";

function limitFrom(request: NextRequest): number {
  const parsed = Number(request.nextUrl.searchParams.get("limit") ?? 5);
  return Number.isFinite(parsed) ? Math.min(20, Math.max(1, Math.trunc(parsed))) : 5;
}

export async function GET(request: NextRequest) {
  if (!isWorkoutApiAuthorized(request)) return workoutApiUnauthorizedResponse();

  try {
    const workouts = await listWorkoutRecords();
    const limit = limitFrom(request);
    return NextResponse.json({
      ok: true,
      count: Math.min(limit, workouts.length),
      sessions: workouts.slice(0, limit).map((workout) => workoutApiPayload(workout, request.nextUrl.origin)),
    });
  } catch (error) {
    console.error("[GET /api/workouts]", error);
    return workoutApiErrorResponse(
      "INTERNAL_ERROR",
      "운동 기록을 불러오지 못했습니다.",
      500,
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isWorkoutApiAuthorized(request)) return workoutApiUnauthorizedResponse();

  try {
    const payload = (await request.json()) as WorkoutSavePayload;
    const idempotencyKey = request.headers.get("idempotency-key") ?? request.headers.get("x-idempotency-key");
    const result = await saveConfirmedWorkout(payload, idempotencyKey);
    const response = workoutApiPayload(result.workout, request.nextUrl.origin);

    return NextResponse.json(
      {
        ok: true,
        status: result.status,
        workoutId: result.workout.id,
        date: result.workout.date,
        url: response.dateUrl,
        detailUrl: response.detailUrl,
        workout: response,
      },
      { status: result.status === "created" ? 201 : 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid workout payload";
    const validationError = error instanceof SyntaxError || /confirmedByUser|date must/.test(message);
    console.error("[POST /api/workouts]", error);
    return workoutApiErrorResponse(
      validationError ? "VALIDATION_ERROR" : "INTERNAL_ERROR",
      validationError ? message : "운동 기록을 저장하지 못했습니다.",
      validationError ? 400 : 500,
    );
  }
}
