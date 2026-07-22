import { createHash } from "node:crypto";

import { firebaseConfig, PERSONAL_USER_ID } from "@/lib/firebaseConfig";
import { normalizeWorkoutRecord } from "@/lib/workoutNormalization";
import type { WorkoutRecord } from "@/types";

type FirestoreRestValue = Record<string, unknown>;
type FirestoreRestDocument = {
  name: string;
  fields?: Record<string, FirestoreRestValue>;
};

const FIRESTORE_DOCUMENTS_URL = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;
const FIRESTORE_API_KEY = firebaseConfig.apiKey;

function decodeFirestoreValue(value: FirestoreRestValue): unknown {
  if ("nullValue" in value) return null;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("stringValue" in value) return value.stringValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("arrayValue" in value) {
    const arrayValue = value.arrayValue as { values?: FirestoreRestValue[] };
    return (arrayValue.values ?? []).map(decodeFirestoreValue);
  }
  if ("mapValue" in value) {
    const mapValue = value.mapValue as { fields?: Record<string, FirestoreRestValue> };
    return decodeFirestoreFields(mapValue.fields ?? {});
  }
  return null;
}

function decodeFirestoreFields(fields: Record<string, FirestoreRestValue>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, decodeFirestoreValue(value)]),
  );
}

function encodeFirestoreValue(value: unknown): FirestoreRestValue {
  if (value == null) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (typeof value === "string") return { stringValue: value };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(encodeFirestoreValue) } };
  }
  if (typeof value === "object") {
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(value as Record<string, unknown>)
            .filter(([, nestedValue]) => nestedValue !== undefined)
            .map(([key, nestedValue]) => [key, encodeFirestoreValue(nestedValue)]),
        ),
      },
    };
  }
  return { nullValue: null };
}

function encodeFirestoreFields(record: Record<string, unknown>): Record<string, FirestoreRestValue> {
  return Object.fromEntries(
    Object.entries(record)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, encodeFirestoreValue(value)]),
  );
}

function workoutIdFromName(name: string): string {
  return name.split("/").pop() ?? "";
}

async function firestoreRequest(url: string, init?: RequestInit): Promise<Response> {
  return fetch(`${url}${url.includes("?") ? "&" : "?"}key=${encodeURIComponent(FIRESTORE_API_KEY)}`, {
    ...init,
    cache: "no-store",
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
}

async function getFirestoreDocument(workoutId: string): Promise<FirestoreRestDocument | null> {
  const response = await firestoreRequest(
    `${FIRESTORE_DOCUMENTS_URL}/workouts/${encodeURIComponent(workoutId)}`,
  );
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Firestore read failed (${response.status})`);
  return response.json() as Promise<FirestoreRestDocument>;
}

function normalizeRestDocument(document: FirestoreRestDocument): WorkoutRecord {
  return normalizeWorkoutRecord(
    workoutIdFromName(document.name),
    decodeFirestoreFields(document.fields ?? {}),
  );
}

export interface WorkoutSavePayload {
  workoutId?: string;
  idempotencyKey?: string;
  idempotencyRequestId?: string;
  confirmedByUser?: boolean;
  date?: string;
  duration?: number | null;
  durationEstimated?: boolean;
  startedAt?: string | null;
  endedAt?: string | null;
  type?: string;
  category?: "PT" | "personal";
  ptNumber?: number | null;
  lessonContent?: string;
  intensity?: "light" | "moderate" | "vigorous";
  caloriesBurned?: number | null;
  calorieEstimate?: unknown;
  exercises?: unknown[];
  strengthExercises?: unknown[];
  cardioExercises?: unknown[];
  exerciseEntryIds?: string[];
  rawMessages?: string[];
  location?: string;
  notes?: string;
  source?: string;
  schemaVersion?: number;
}

function isDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function cleanString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function safeWorkoutId(value: unknown): string | null {
  return typeof value === "string" && /^[A-Za-z0-9_-]{1,160}$/.test(value) ? value : null;
}

function stableKey(payload: WorkoutSavePayload, requestedKey?: string | null): string {
  const explicit = cleanString(requestedKey) || cleanString(payload.idempotencyKey);
  if (explicit) return explicit;
  return JSON.stringify({
    date: payload.date,
    type: payload.type,
    duration: payload.duration,
    exercises: payload.exercises,
    strengthExercises: payload.strengthExercises,
    cardioExercises: payload.cardioExercises,
    notes: payload.notes,
  });
}

export async function listWorkoutRecords(): Promise<WorkoutRecord[]> {
  const response = await firestoreRequest(`${FIRESTORE_DOCUMENTS_URL}:runQuery`, {
    method: "POST",
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: "workouts" }],
        where: {
          fieldFilter: {
            field: { fieldPath: "userId" },
            op: "EQUAL",
            value: { stringValue: PERSONAL_USER_ID },
          },
        },
      },
    }),
  });
  if (!response.ok) throw new Error(`Firestore query failed (${response.status})`);
  const rows = (await response.json()) as Array<{ document?: FirestoreRestDocument }>;

  return rows
    .flatMap((row) => (row.document ? [normalizeRestDocument(row.document)] : []))
    .sort((a, b) => {
      const dateOrder = b.date.localeCompare(a.date);
      if (dateOrder !== 0) return dateOrder;
      return String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""));
    });
}

export async function getWorkoutRecord(workoutId: string): Promise<WorkoutRecord | null> {
  const safeId = safeWorkoutId(workoutId);
  if (!safeId) return null;

  const document = await getFirestoreDocument(safeId);
  if (!document) return null;
  const data = decodeFirestoreFields(document.fields ?? {});
  if (data.userId !== PERSONAL_USER_ID) return null;
  return normalizeWorkoutRecord(safeId, data);
}

export async function saveConfirmedWorkout(
  payload: WorkoutSavePayload,
  requestedIdempotencyKey?: string | null,
): Promise<{ status: "created" | "existing"; workout: WorkoutRecord }> {
  if (payload.confirmedByUser !== true) {
    throw new Error("confirmedByUser must be true before saving a workout");
  }
  if (!isDate(payload.date)) {
    throw new Error("date must use YYYY-MM-DD format");
  }

  const idempotencyKey = stableKey(payload, requestedIdempotencyKey);
  const hash = createHash("sha256").update(idempotencyKey).digest("hex").slice(0, 16);
  const workoutId = safeWorkoutId(payload.workoutId) ?? `gpt-${payload.date}-${hash}`;
  const existing = await getFirestoreDocument(workoutId);

  if (existing) {
    const existingData = decodeFirestoreFields(existing.fields ?? {});
    if (existingData.userId !== PERSONAL_USER_ID) throw new Error("workoutId is not available");
    return { status: "existing", workout: normalizeWorkoutRecord(workoutId, existingData) };
  }

  const record = {
    userId: PERSONAL_USER_ID,
    date: payload.date,
    duration: typeof payload.duration === "number" ? payload.duration : null,
    durationEstimated: payload.durationEstimated === true,
    startedAt: payload.startedAt ?? null,
    endedAt: payload.endedAt ?? null,
    type: cleanString(payload.type, "운동"),
    category: payload.category === "PT" ? "PT" : "personal",
    ptNumber: typeof payload.ptNumber === "number" ? payload.ptNumber : null,
    lessonContent: cleanString(payload.lessonContent),
    intensity: payload.intensity ?? "moderate",
    caloriesBurned: typeof payload.caloriesBurned === "number" ? payload.caloriesBurned : null,
    calorieEstimate: payload.calorieEstimate ?? null,
    exercises: Array.isArray(payload.exercises) ? payload.exercises : [],
    strengthExercises: Array.isArray(payload.strengthExercises) ? payload.strengthExercises : [],
    cardioExercises: Array.isArray(payload.cardioExercises) ? payload.cardioExercises : [],
    exerciseEntryIds: Array.isArray(payload.exerciseEntryIds) ? payload.exerciseEntryIds : [],
    rawMessages: Array.isArray(payload.rawMessages) ? payload.rawMessages : [],
    location: cleanString(payload.location),
    notes: cleanString(payload.notes),
    source: cleanString(payload.source, "chatgpt-action"),
    schemaVersion: typeof payload.schemaVersion === "number" ? payload.schemaVersion : 2,
    confirmedByUser: true,
    idempotencyKey,
    idempotencyRequestId: cleanString(payload.idempotencyRequestId),
    savedAt: new Date().toISOString(),
    createdAt: new Date(),
  };

  const response = await firestoreRequest(
    `${FIRESTORE_DOCUMENTS_URL}/workouts/${encodeURIComponent(workoutId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ fields: encodeFirestoreFields(record) }),
    },
  );
  if (!response.ok) throw new Error(`Firestore save failed (${response.status})`);
  const saved = (await response.json()) as FirestoreRestDocument;
  return { status: "created", workout: normalizeRestDocument(saved) };
}

export function workoutApiPayload(workout: WorkoutRecord, origin: string) {
  return {
    workoutId: workout.id,
    date: workout.date,
    type: workout.type ?? "운동",
    category: workout.category ?? "personal",
    ptNumber: workout.ptNumber ?? null,
    duration: workout.duration,
    durationDerivedFromCardio: workout.durationDerivedFromCardio ?? false,
    intensity: workout.intensity ?? null,
    caloriesBurned: workout.caloriesBurned ?? null,
    exercises: workout.exercises ?? [],
    cardioExercises: workout.cardioExercises ?? [],
    lessonContent: workout.lessonContent ?? "",
    notes: workout.notes ?? "",
    dateUrl: `${origin}/?date=${workout.date}`,
    detailUrl: `${origin}/workouts/${workout.id}`,
  };
}
