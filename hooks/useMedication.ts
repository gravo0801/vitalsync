"use client";
import { useEffect, useState } from "react";
import {
  collection, onSnapshot, query, where,
  addDoc, deleteDoc, updateDoc, doc, Timestamp,
} from "firebase/firestore";
import { db, PERSONAL_USER_ID } from "@/lib/firebase";
import type { MedicationRecord } from "@/types";

export function useMedication() {
  const [records, setRecords] = useState<MedicationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "medications"),
      where("userId", "==", PERSONAL_USER_ID)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as MedicationRecord)
        );
        // 주사일 오름차순
        docs.sort((a, b) => a.injectionDate.localeCompare(b.injectionDate));
        setRecords(docs);
        setLoading(false);
      },
      (err) => {
        console.error("[useMedication] onSnapshot error:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const addMedication = async (
    data: Omit<MedicationRecord, "id" | "createdAt">
  ) => {
    await addDoc(collection(db, "medications"), {
      ...data,
      userId: PERSONAL_USER_ID,
      createdAt: Timestamp.now(),
    });
  };

  const updateMedication = async (
    id: string,
    data: Partial<Omit<MedicationRecord, "id" | "createdAt">>
  ) => {
    await updateDoc(doc(db, "medications", id), data);
  };

  const deleteMedication = async (id: string) => {
    await deleteDoc(doc(db, "medications", id));
  };

  return { records, loading, addMedication, updateMedication, deleteMedication };
}
