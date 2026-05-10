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

  // ⭐ PT 회차 부여
  // 1. 저장된 ptNumber가 있으면 그걸 사용 (수동 지정 우선)
  // 2. 없는 PT는 날짜+createdAt 순서로 빈 회차 번호를 채움
  const workoutsWithPt = useMemo<WorkoutWithPtNumber[]>(() => {
    const ptList = workouts.filter((w) => w.category === "PT");
    const usedNumbers = new Set<number>();
    ptList.forEach((w) => {
      if (typeof w.ptNumber === "number") usedNumbers.add(w.ptNumber);
    });

    const withoutStored = ptList
      .filter((w) => typeof w.ptNumber !== "number")
      .sort((a, b) => {
        const cmp = a.date.localeCompare(b.date);
        if (cmp !== 0) return cmp;
        const ta = a.createdAt?.toMillis?.() ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? 0;
        return ta - tb;
      });

    const dynamicMap = new Map<string, number>();
    let counter = 1;
    for (const w of withoutStored) {
      while (usedNumbers.has(counter)) counter++;
      dynamicMap.set(w.id, counter);
      counter++;
    }

    return workouts.map((w) => ({
      ...w,
      ptNumber:
        w.category === "PT"
          ? typeof w.ptNumber === "number"
            ? w.ptNumber
            : dynamicMap.get(w.id)
          : undefined,
    }));
  }, [workouts]);

  const addWorkout = async (params: {
    date: string;
    duration: number;
    type?: string;
    category?: WorkoutCategory;
    ptNumber?: number;
    lessonContent?: string;
    caloriesBurned?: number;
    notes?: string;
  }) => {
    await addDoc(collection(db, "workouts"), {
      userId: PERSONAL_USER_ID,
      date: params.date,
      duration: params.duration,
      type: params.type || "",
      category: params.category || "personal",
      ptNumber: params.ptNumber ?? null,
      lessonContent: params.lessonContent || "",
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

  // PT 모달 기본값: 단순 개수보다 "현재 쓰인 최대 회차 + 1"이 실제 회차 흐름에 맞음
  const nextPTNumber = useMemo(() => {
    const ptNumbers = workoutsWithPt
      .filter((w) => w.category === "PT" && typeof w.ptNumber === "number")
      .map((w) => w.ptNumber as number);
    return ptNumbers.length > 0 ? Math.max(...ptNumbers) + 1 : 1;
  }, [workoutsWithPt]);

  return {
    workouts: workoutsWithPt,
    loading,
    totalPTCount: nextPTNumber - 1,
    nextPTNumber,
    addWorkout,
    updateWorkout,
    deleteWorkout,
  };
}
