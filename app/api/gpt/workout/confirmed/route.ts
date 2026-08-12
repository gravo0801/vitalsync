import { NextRequest } from "next/server";

import { POST as saveConfirmedWorkout } from "@/app/api/workouts/route";
import { workoutApiErrorResponse } from "@/lib/workoutApiResponses";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return saveConfirmedWorkout(request);
}

export function GET() {
  return workoutApiErrorResponse(
    "METHOD_NOT_ALLOWED",
    "Use POST to save a confirmed workout.",
    405,
  );
}

