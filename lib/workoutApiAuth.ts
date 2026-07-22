import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

const WORKOUT_API_KEY_SHA256 =
  "7df89e1a0792dbdbbd23f324f9e1263f70e3ba0638f85e424a6f4de32c8d5fb5";

export function isWorkoutApiAuthorized(request: NextRequest): boolean {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return false;

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) return false;

  const actual = Buffer.from(createHash("sha256").update(token).digest("hex"));
  const expected = Buffer.from(WORKOUT_API_KEY_SHA256);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function workoutApiUnauthorizedResponse() {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authorization: Bearer <VitalSync workout API key> is required.",
      },
    },
    { status: 401 },
  );
}
