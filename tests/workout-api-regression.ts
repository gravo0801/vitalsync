import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { NextRequest } from "next/server";

import { GET as unknownGptRoute } from "@/app/api/gpt/[...path]/route";
import { GET as legacyOpenApiSchema } from "@/app/api/gpt/openapi.json/route";
import { POST as getWorkoutContext } from "@/app/api/gpt/workout/context/route";
import {
  GET as invalidSaveMethod,
  POST as saveWorkoutRoute,
} from "@/app/api/gpt/workout/confirmed/route";
import { POST as legacySaveWorkoutRoute } from "@/app/api/gpt/workouts/route";
import { POST as legacyGetWorkoutContext } from "@/app/api/gpt/workouts/context/route";
import { getWorkoutApiAuthResult, isWorkoutApiAuthorized } from "@/lib/workoutApiAuth";
import { saveConfirmedWorkout } from "@/lib/workoutRepository";

const workoutId = "gpt-2026-08-12-b1371d705da171e2";
let passed = 0;

function firestoreDocument() {
  return {
    name: `projects/vitalsync-8c169/databases/(default)/documents/workouts/${workoutId}`,
    fields: {
      userId: { stringValue: "personal-user" },
      date: { stringValue: "2026-08-12" },
      type: { stringValue: "근력" },
      category: { stringValue: "personal" },
      duration: { nullValue: null },
      notes: { stringValue: "API regression test" },
      exercises: { arrayValue: { values: [] } },
      strengthExercises: { arrayValue: { values: [] } },
      cardioExercises: { arrayValue: { values: [] } },
    },
  };
}

async function check(name: string, test: () => Promise<void>) {
  await test();
  passed += 1;
  console.log(`PASS ${name}`);
}

async function main() {
  await check("OpenAPI response objects declare properties", async () => {
    const schema = readFileSync(new URL("../public/vitalsync-workout-openapi.yaml", import.meta.url), "utf8");
    assert.doesNotMatch(schema, /type: object\r?\n\s+additionalProperties: true/);
    for (const responseSchema of [
      "WorkoutContextResponse",
      "ExerciseHistoryResponse",
      "WorkoutDetailResponse",
      "WorkoutListResponse",
      "WorkoutSaveResponse",
    ]) {
      assert.match(schema, new RegExp(`\\$ref: \"#/components/schemas/${responseSchema}\"`));
    }
  });

  await check("bearer authentication uses the configured environment key", async () => {
    const previousKey = process.env.VITALSYNC_GPT_ACTION_KEY;
    process.env.VITALSYNC_GPT_ACTION_KEY = "test-only-action-key";
    try {
      assert.equal(
        isWorkoutApiAuthorized(
          new NextRequest("http://localhost/api/gpt/workouts", {
            headers: { authorization: "Bearer test-only-action-key" },
          }),
        ),
        true,
      );
      assert.equal(
        isWorkoutApiAuthorized(
          new NextRequest("http://localhost/api/gpt/workouts", {
            headers: { authorization: "Bearer wrong-key" },
          }),
        ),
        false,
      );
    } finally {
      if (previousKey === undefined) delete process.env.VITALSYNC_GPT_ACTION_KEY;
      else process.env.VITALSYNC_GPT_ACTION_KEY = previousKey;
    }
  });

  await check("authentication diagnostics distinguish missing and mismatched keys", async () => {
    const previousKey = process.env.VITALSYNC_GPT_ACTION_KEY;
    process.env.VITALSYNC_GPT_ACTION_KEY = "test-only-action-key";
    try {
      assert.deepEqual(
        getWorkoutApiAuthResult(new NextRequest("http://localhost/api/gpt/workouts")),
        { ok: false, reason: "missing_header" },
      );
      assert.deepEqual(
        getWorkoutApiAuthResult(
          new NextRequest("http://localhost/api/gpt/workouts", {
            headers: { authorization: "Bearer wrong-key" },
          }),
        ),
        { ok: false, reason: "key_mismatch" },
      );
    } finally {
      if (previousKey === undefined) delete process.env.VITALSYNC_GPT_ACTION_KEY;
      else process.env.VITALSYNC_GPT_ACTION_KEY = previousKey;
    }
  });

  await check("context returns JSON 401 without bearer token", async () => {
    const response = await getWorkoutContext(
      new NextRequest("http://localhost/api/gpt/workout/context", { method: "POST" }),
    );
    assert.equal(response.status, 401);
    assert.match(response.headers.get("content-type") ?? "", /application\/json/);
    assert.equal((await response.json()).error.code, "UNAUTHORIZED");
  });

  await check("save returns JSON 401 without bearer token", async () => {
    const response = await saveWorkoutRoute(
      new NextRequest("http://localhost/api/gpt/workout/confirmed", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      }),
    );
    assert.equal(response.status, 401);
    assert.match(response.headers.get("content-type") ?? "", /application\/json/);
    assert.equal((await response.json()).error.code, "UNAUTHORIZED");
  });

  await check("save GET returns JSON 405", async () => {
    const response = invalidSaveMethod();
    assert.equal(response.status, 405);
    assert.equal((await response.json()).error.code, "METHOD_NOT_ALLOWED");
  });

  await check("plural context route remains compatible", async () => {
    const response = await legacyGetWorkoutContext(
      new NextRequest("http://localhost/api/gpt/workouts/context", { method: "POST" }),
    );
    assert.equal(response.status, 401);
    assert.equal((await response.json()).error.code, "UNAUTHORIZED");
  });

  await check("plural save route remains compatible", async () => {
    const response = await legacySaveWorkoutRoute(
      new NextRequest("http://localhost/api/gpt/workouts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      }),
    );
    assert.equal(response.status, 401);
    assert.equal((await response.json()).error.code, "UNAUTHORIZED");
  });

  await check("legacy schema URL redirects to the current schema", async () => {
    const response = legacyOpenApiSchema(
      new NextRequest("https://vitalsync-sigma.vercel.app/api/gpt/openapi.json"),
    );
    assert.equal(response.status, 307);
    assert.equal(
      response.headers.get("location"),
      "https://vitalsync-sigma.vercel.app/vitalsync-workout-openapi.yaml",
    );
  });

  await check("unknown GPT route returns JSON 404", async () => {
    const response = unknownGptRoute(
      new NextRequest("http://localhost/api/gpt/workout/missing"),
    );
    assert.equal(response.status, 404);
    assert.match(response.headers.get("content-type") ?? "", /application\/json/);
    assert.equal((await response.json()).error.code, "NOT_FOUND");
  });

  await check("new idempotency key creates a Firestore workout", async () => {
    const originalFetch = globalThis.fetch;
    const calls: Array<[RequestInfo | URL, RequestInit | undefined]> = [];
    const responses = [
      new Response(null, { status: 404 }),
      Response.json(firestoreDocument(), { status: 200 }),
    ];
    globalThis.fetch = async (input, init) => {
      calls.push([input, init]);
      return responses.shift() ?? new Response(null, { status: 500 });
    };
    try {
      const result = await saveConfirmedWorkout(
        {
          confirmedByUser: true,
          date: "2026-08-12",
          type: "근력",
          notes: "API regression test",
        },
        "workout-api-regression-key",
      );
      assert.equal(result.status, "created");
      assert.equal(calls.length, 2);
      assert.equal(calls[1]?.[1]?.method, "PATCH");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await check("existing idempotency key returns duplicate without writing", async () => {
    const originalFetch = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = async () => {
      calls += 1;
      return Response.json(firestoreDocument(), { status: 200 });
    };
    try {
      const result = await saveConfirmedWorkout(
        { confirmedByUser: true, date: "2026-08-12", type: "근력" },
        "workout-api-regression-key",
      );
      assert.equal(result.status, "duplicate");
      assert.equal(calls, 1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await check("unconfirmed workout is rejected before Firestore access", async () => {
    const originalFetch = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = async () => {
      calls += 1;
      return new Response(null, { status: 500 });
    };
    try {
      await assert.rejects(
        saveConfirmedWorkout({ date: "2026-08-12", confirmedByUser: false }),
        /confirmedByUser must be true/,
      );
      assert.equal(calls, 0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  console.log(`PASS ${passed}/13 workout API regression checks`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

