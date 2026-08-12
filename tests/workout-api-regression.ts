import assert from "node:assert/strict";

import { NextRequest } from "next/server";

import { GET as unknownGptRoute } from "@/app/api/gpt/[...path]/route";
import { POST as getWorkoutContext } from "@/app/api/gpt/workout/context/route";
import {
  GET as invalidSaveMethod,
  POST as saveWorkoutRoute,
} from "@/app/api/gpt/workout/confirmed/route";
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

  console.log(`PASS ${passed}/7 workout API regression checks`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

