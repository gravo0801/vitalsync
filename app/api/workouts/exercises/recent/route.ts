import { NextRequest, NextResponse } from "next/server";

import { isWorkoutApiAuthorized, workoutApiUnauthorizedResponse } from "@/lib/workoutApiAuth";
import { listWorkoutRecords } from "@/lib/workoutRepository";

export const dynamic = "force-dynamic";

function normalizedName(value: string): string {
  return value.toLocaleLowerCase().replace(/[\s_-]+/g, "");
}

export async function GET(request: NextRequest) {
  if (!isWorkoutApiAuthorized(request)) return workoutApiUnauthorizedResponse();

  try {
    const requestedName = request.nextUrl.searchParams.get("name")?.trim() ?? "";
    const parsedLimit = Number(request.nextUrl.searchParams.get("limit") ?? 5);
    const limit = Number.isFinite(parsedLimit) ? Math.min(20, Math.max(1, Math.trunc(parsedLimit))) : 5;
    const requestedKey = normalizedName(requestedName);
    const workouts = await listWorkoutRecords();
    const history: Array<Record<string, unknown>> = [];
    const latestByExercise = new Map<string, Record<string, unknown>>();

    workouts.forEach((workout) => {
      workout.exercises?.forEach((exercise) => {
        const key = normalizedName(exercise.name);
        const item = {
          exerciseName: exercise.name,
          date: workout.date,
          workoutId: workout.id,
          sets: exercise.sets,
          notes: exercise.notes ?? "",
          detailUrl: `${request.nextUrl.origin}/workouts/${workout.id}`,
        };

        if (!latestByExercise.has(key)) latestByExercise.set(key, item);
        if (requestedKey && key === requestedKey && history.length < limit) history.push(item);
      });
    });

    if (requestedKey && history.length === 0) {
      return NextResponse.json(
        { ok: false, error: "exercise_not_found", message: `운동 종목 '${requestedName}'의 기록이 없습니다.` },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      exerciseName: requestedName || null,
      count: requestedKey ? history.length : latestByExercise.size,
      history: requestedKey ? history : undefined,
      latestExercises: requestedKey ? undefined : [...latestByExercise.values()],
    });
  } catch (error) {
    console.error("[GET /api/workouts/exercises/recent]", error);
    return NextResponse.json(
      { ok: false, error: "exercise_history_read_failed", message: "종목별 최근 기록을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
