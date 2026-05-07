"use client";
import { useEffect, useState } from "react";
import {
  collection, onSnapshot, query, where,
  addDoc, deleteDoc, updateDoc, doc, Timestamp,
} from "firebase/firestore";
import { db, PERSONAL_USER_ID } from "@/lib/firebase";
import type { WorkoutRecord } from "@/types";

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<WorkoutRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ⭐ orderBy 제거 - 클라이언트에서 정렬
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

  const addWorkout = async (params: {
    date: string;
    duration: number;
    type?: string;
    caloriesBurned?: number;
    notes?: string;
  }) => {
    await addDoc(collection(db, "workouts"), {
      userId: PERSONAL_USER_ID,
      date: params.date,
      duration: params.duration,
      type: params.type || "",
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

  return { workouts, loading, addWorkout, updateWorkout, deleteWorkout };
}
