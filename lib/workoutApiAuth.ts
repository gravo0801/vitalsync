import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";

import { workoutApiErrorResponse } from "@/lib/workoutApiResponses";

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

export function isWorkoutApiAuthorized(request: NextRequest): boolean {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return false;

  const token = authorization.slice("Bearer ".length).trim();
  const configuredKey = process.env.VITALSYNC_GPT_ACTION_KEY?.trim();
  if (!token || !configuredKey) return false;

  return timingSafeEqual(digest(token), digest(configuredKey));
}

export function workoutApiUnauthorizedResponse() {
  return workoutApiErrorResponse(
    "UNAUTHORIZED",
    "Authorization: Bearer <VitalSync workout API key> is required.",
    401,
  );
}
