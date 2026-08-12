import { NextRequest } from "next/server";

import { GET as getRecentWorkoutSessions } from "@/app/api/workouts/recent/route";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return getRecentWorkoutSessions(request);
}

// The original GPT Action schema used POST with an empty JSON body.
// Keep GET as well so both schema generations remain compatible.
export async function POST(request: NextRequest) {
  return getRecentWorkoutSessions(request);
}

