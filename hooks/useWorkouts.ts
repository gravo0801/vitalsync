"use client";
import { useEffect, useMemo, useState } from "react";
import {
  collection, onSnapshot, query, where,
  addDoc, deleteDoc, updateDoc, doc, Timestamp,
} from "firebase/firestore";
import { db, PERSONAL_USER_ID } from "@/lib/firebase";
import type { WorkoutCategory, WorkoutRecord, WorkoutWithPtNumber } from "@/types";

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<WorkoutRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "workouts"),
      where("userId", "==", PERSONAL_USER_ID)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as WorkoutRecord));
        docs.sort((a, b) => a.date.localeCompare(b.date));
        setWorkouts(docs);
        setLoading(false);
      },
      (err) => {
        console.error("[useWorkouts] onSnapshot error:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // ⭐ PT 회차를 동적으로 계산 (저장 X)
  // 날짜 + createdAt 순서로 PT만 추출 → 1, 2, 3... 부여
  const workoutsWithPt = useMemo<WorkoutWithPtNumber[]>(() => {
    const ptOrdered = [...workouts]
      .filter((w) => w.category === "PT")
      .sort((a, b) => {
        // 1차: 날짜 오름차순
        const cmp = a.date.localeCompare(b.date);
        if (cmp !== 0) return cmp;
        // 2차: createdAt 오름차순 (같은 날 여러 PT 시)
        const ta = a.createdAt?.toMillis?.() ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? 0;
        return ta - tb;
      });

    const ptNumberMap = new Map<string, number>();
    ptOrdered.forEach((w, idx) => ptNumberMap.set(w.id, idx + 1));

    return workouts.map((w) => ({
      ...w,
      ptNumber: ptNumberMap.get(w.id),
    }));
  }, [workouts]);

  const addWorkout = async (params: {
    date: string;
    duration: number;
    type?: string;
    category?: WorkoutCategory;
    caloriesBurned?: number;
    notes?: string;
  }) => {
    await addDoc(collection(db, "workouts"), {
      userId: PERSONAL_USER_ID,
      date: params.date,
      duration: params.duration,
      type: params.type || "",
      category: params.category || "personal",
      caloriesBurned: params.caloriesBurned ?? null,
      notes: params.notes || "",
      createdAt: Timestamp.now(),
    });
  };

  const updateWorkout = async (
    id: string,
    data: Partial<Omit<WorkoutRecord, "id" | "createdAt">>
  ) => {
    await updateDoc(doc(db, "workouts", id), data);
  };

  const deleteWorkout = async (id: string) => {
    await deleteDoc(doc(db, "workouts", id));
  };

  // 누적 PT 횟수 (PT 모달의 미리보기용)
  const totalPTCount = useMemo(
    () => workouts.filter((w) => w.category === "PT").length,
    [workouts]
  );

  return {
    workouts: workoutsWithPt,
    loading,
    totalPTCount,
    addWorkout,
    updateWorkout,
    deleteWorkout,
  };
}
