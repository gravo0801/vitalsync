import { NextRequest } from "next/server";

import {
  GET as invalidSaveMethod,
  POST as saveConfirmedWorkout,
} from "@/app/api/gpt/workout/confirmed/route";

export const dynamic = "force-dynamic";

// Backward-compatible route for GPTs configured with the original plural path.
export async function POST(request: NextRequest) {
  return saveConfirmedWorkout(request);
}

export const GET = invalidSaveMethod;
