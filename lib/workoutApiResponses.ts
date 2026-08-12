import { NextResponse } from "next/server";

export function workoutApiErrorResponse(
  code: string,
  message: string,
  status: number,
) {
  return NextResponse.json(
    {
      ok: false,
      error: { code, message },
    },
    { status },
  );
}

