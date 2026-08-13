import { NextRequest } from "next/server";

// Keep the original schema URL working for existing setup documentation and GPTs.
export function GET(request: NextRequest) {
  return Response.redirect(
    new URL("/vitalsync-workout-openapi.yaml", request.url),
    307,
  );
}
