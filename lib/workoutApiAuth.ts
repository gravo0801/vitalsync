import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";

import { workoutApiErrorResponse } from "@/lib/workoutApiResponses";

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

export type WorkoutApiAuthResult =
  | { ok: true }
  | {
      ok: false;
      reason: "missing_header" | "wrong_scheme" | "empty_token" | "missing_configuration" | "key_mismatch";
    };

export function getWorkoutApiAuthResult(request: NextRequest): WorkoutApiAuthResult {
  const authorization = request.headers.get("authorization");
  if (!authorization) return { ok: false, reason: "missing_header" };
  if (!authorization.startsWith("Bearer ")) return { ok: false, reason: "wrong_scheme" };

  const token = authorization.slice("Bearer ".length).trim();
  const configuredKey = process.env.VITALSYNC_GPT_ACTION_KEY?.trim();
  if (!token) return { ok: false, reason: "empty_token" };
  if (!configuredKey) return { ok: false, reason: "missing_configuration" };

  return timingSafeEqual(digest(token), digest(configuredKey))
    ? { ok: true }
    : { ok: false, reason: "key_mismatch" };
}

export function isWorkoutApiAuthorized(request: NextRequest): boolean {
  return getWorkoutApiAuthResult(request).ok;
}

export function workoutApiUnauthorizedResponse(request?: NextRequest) {
  const result = request ? getWorkoutApiAuthResult(request) : null;
  const reason = result && !result.ok ? result.reason : "missing_header";
  const messages = {
    missing_header: "ChatGPT Action이 Authorization 헤더를 보내지 않았습니다. GPT 편집기에서 API Key / Bearer 인증을 다시 저장해 주세요.",
    wrong_scheme: "Authorization 인증 방식이 Bearer가 아닙니다. GPT Action 인증 유형을 Bearer로 설정해 주세요.",
    empty_token: "Authorization Bearer 값이 비어 있습니다. GPT Action에 VitalSync API Key를 다시 입력해 주세요.",
    missing_configuration: "VitalSync 서버의 Action API Key 설정이 누락되었습니다.",
    key_mismatch: "GPT Action의 Bearer API Key가 VitalSync 서버에 설정된 키와 일치하지 않습니다.",
  } as const;
  return workoutApiErrorResponse(
    "UNAUTHORIZED",
    messages[reason],
    401,
  );
}
