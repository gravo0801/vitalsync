import { NextRequest } from "next/server";

import { workoutApiErrorResponse } from "@/lib/workoutApiResponses";

function notFound(request: NextRequest) {
  return workoutApiErrorResponse(
    "NOT_FOUND",
    `GPT API route '${request.nextUrl.pathname}' was not found.`,
    404,
  );
}

export const GET = notFound;
export const POST = notFound;
export const PUT = notFound;
export const PATCH = notFound;
export const DELETE = notFound;

