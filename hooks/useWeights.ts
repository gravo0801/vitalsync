"use client";
import { useEffect, useState } from "react";
import {
  collection, onSnapshot, query, where,
  addDoc, deleteDoc, updateDoc, doc, Timestamp,
} from "firebase/firestore";
import { db, PERSONAL_USER_ID } from "@/lib/firebase";
import type { WeightRecord } from "@/types";

export function useWeights() {
  const [weights, setWeights] = useState<WeightRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ⭐ orderBy 제거 - 복합 인덱스 불필요. 클라이언트에서 정렬.
    const q = query(
      collection(db, "weights"),
      where("userId", "==", PERSONAL_USER_ID)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as WeightRecord));
        docs.sort((a, b) => a.date.localeCompare(b.date));
        setWeights(docs);
        setLoading(false);
      },
      (err) => {
        console.error("[useWeights] onSnapshot error:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const addWeight = async (date: string, weight: number, memo?: string) => {
    await addDoc(collection(db, "weights"), {
      userId: PERSONAL_USER_ID,
      date,
      weight,
      memo: memo || "",
      createdAt: Timestamp.now(),
    });
  };

  const updateWeight = async (id: string, weight: number, memo?: string) => {
    await updateDoc(doc(db, "weights", id), { weight, memo: memo || "" });
  };

  const deleteWeight = async (id: string) => {
    await deleteDoc(doc(db, "weights", id));
  };

  return { weights, loading, addWeight, updateWeight, deleteWeight };
}
