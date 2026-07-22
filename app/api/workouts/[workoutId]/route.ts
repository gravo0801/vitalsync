import { NextRequest, NextResponse } from "next/server";

import { isWorkoutApiAuthorized, workoutApiUnauthorizedResponse } from "@/lib/workoutApiAuth";
import { getWorkoutRecord, workoutApiPayload } from "@/lib/workoutRepository";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workoutId: string }> },
) {
  if (!isWorkoutApiAuthorized(request)) return workoutApiUnauthorizedResponse();

  try {
    const { workoutId } = await params;
    const workout = await getWorkoutRecord(workoutId);

    if (!workout) {
      return NextResponse.json(
        { ok: false, error: "workout_not_found", message: "해당 운동 기록을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, workout: workoutApiPayload(workout, request.nextUrl.origin) });
  } catch (error) {
    console.error("[GET /api/workouts/:workoutId]", error);
    return NextResponse.json(
      { ok: false, error: "workout_read_failed", message: "운동 상세 기록을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
