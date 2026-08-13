import { NextRequest } from "next/server";

import {
  GET as getWorkoutContext,
  POST as postWorkoutContext,
} from "@/app/api/gpt/workout/context/route";

export const dynamic = "force-dynamic";

// Backward-compatible route for GPTs configured with the original plural path.
export async function GET(request: NextRequest) {
  return getWorkoutContext(request);
}

export async function POST(request: NextRequest) {
  return postWorkoutContext(request);
}
