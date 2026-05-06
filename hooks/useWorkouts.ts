"use client";
import { useEffect, useState } from "react";
import {
  collection, onSnapshot, query, where, orderBy,
  addDoc, deleteDoc, updateDoc, doc, Timestamp,
} from "firebase/firestore";
import { db, PERSONAL_USER_ID } from "@/lib/firebase";
import type { WorkoutRecord } from "@/types";

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<WorkoutRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "workouts"),
      where("userId", "==", PERSONAL_USER_ID),
      orderBy("date", "asc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setWorkouts(
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as WorkoutRecord))
        );
        setLoading(false);
      },
      () => setLoading(false)
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
