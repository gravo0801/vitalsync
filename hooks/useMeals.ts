"use client";
import { useEffect, useState } from "react";
import {
  collection, onSnapshot, query, where,
  addDoc, deleteDoc, updateDoc, doc, Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage, PERSONAL_USER_ID } from "@/lib/firebase";
import type { MealRecord, MealType } from "@/types";

export function useMeals() {
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "meals"),
      where("userId", "==", PERSONAL_USER_ID)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as MealRecord));
        docs.sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() ?? 0;
          const tb = b.createdAt?.toMillis?.() ?? 0;
          return tb - ta;
        });
        setMeals(docs);
        setLoading(false);
      },
      (err) => {
        console.error("[useMeals] onSnapshot error:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const addMeal = async (params: {
    date: string;
    mealType: MealType;
    calories: number | null;
    proteinG?: number | null;
    content?: string;
    photo?: File | null;
  }) => {
    let photoURL: string | undefined;
    if (params.photo) {
      const storageRef = ref(
        storage,
        `meals/${PERSONAL_USER_ID}/${Date.now()}_${params.photo.name}`
      );
      await uploadBytes(storageRef, params.photo);
      photoURL = await getDownloadURL(storageRef);
    }
    await addDoc(collection(db, "meals"), {
      userId: PERSONAL_USER_ID,
      date: params.date,
      mealType: params.mealType,
      calories: params.calories,
      proteinG: params.proteinG ?? null,
      content: params.content || "",
      photoURL,
      createdAt: Timestamp.now(),
    });
  };

  const updateMeal = async (
    id: string,
    data: { mealType?: MealType; calories?: number | null; proteinG?: number | null; content?: string }
  ) => {
    await updateDoc(doc(db, "meals", id), data);
  };

  const deleteMeal = async (meal: MealRecord) => {
    if (meal.photoURL) {
      try {
        await deleteObject(ref(storage, meal.photoURL));
      } catch {
        // 이미 없을 수 있음
      }
    }
    await deleteDoc(doc(db, "meals", meal.id));
  };

  return { meals, loading, addMeal, updateMeal, deleteMeal };
}
