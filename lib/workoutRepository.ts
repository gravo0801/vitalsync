import { createHash } from "node:crypto";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { PERSONAL_USER_ID } from "@/lib/firebaseConfig";
import { serverDb } from "@/lib/firebaseServer";
import { normalizeWorkoutRecord } from "@/lib/workoutNormalization";
import type { WorkoutRecord } from "@/types";

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
  const snapshot = await getDocs(
    query(collection(serverDb, "workouts"), where("userId", "==", PERSONAL_USER_ID)),
  );

  return snapshot.docs
    .map((snapshotDoc) => normalizeWorkoutRecord(snapshotDoc.id, snapshotDoc.data()))
    .sort((a, b) => {
      const dateOrder = b.date.localeCompare(a.date);
      if (dateOrder !== 0) return dateOrder;
      return (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0);
    });
}

export async function getWorkoutRecord(workoutId: string): Promise<WorkoutRecord | null> {
  const safeId = safeWorkoutId(workoutId);
  if (!safeId) return null;

  const snapshot = await getDoc(doc(serverDb, "workouts", safeId));
  if (!snapshot.exists() || snapshot.data().userId !== PERSONAL_USER_ID) return null;
  return normalizeWorkoutRecord(snapshot.id, snapshot.data());
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
  const reference = doc(serverDb, "workouts", workoutId);
  const existing = await getDoc(reference);

  if (existing.exists()) {
    if (existing.data().userId !== PERSONAL_USER_ID) throw new Error("workoutId is not available");
    return { status: "existing", workout: normalizeWorkoutRecord(existing.id, existing.data()) };
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
    createdAt: serverTimestamp(),
  };

  await setDoc(reference, record);
  const saved = await getDoc(reference);
  if (!saved.exists()) throw new Error("saved workout could not be read back");
  return { status: "created", workout: normalizeWorkoutRecord(saved.id, saved.data()) };
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
