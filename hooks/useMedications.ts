"use client";
import { useEffect, useMemo, useState } from "react";
import {
  collection, onSnapshot, query, where,
  addDoc, deleteDoc, updateDoc, doc, Timestamp,
} from "firebase/firestore";
import { db, PERSONAL_USER_ID } from "@/lib/firebase";
import type { MedicationRecord, MounjaroDose, InjectionSite } from "@/types";

export function useMedications() {
  const [medications, setMedications] = useState<MedicationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "medications"),
      where("userId", "==", PERSONAL_USER_ID)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as MedicationRecord));
        docs.sort((a, b) => a.date.localeCompare(b.date));
        setMedications(docs);
        setLoading(false);
      },
      (err) => {
        console.error("[useMedications] onSnapshot error:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const addMedication = async (params: {
    date: string;
    doseMg: MounjaroDose;
    injectionSite?: InjectionSite;
    sideEffects?: string;
    weightKgAtInjection?: number;
  }) => {
    await addDoc(collection(db, "medications"), {
      userId: PERSONAL_USER_ID,
      date: params.date,
      medicationType: "mounjaro",
      doseMg: params.doseMg,
      injectionSite: params.injectionSite ?? null,
      sideEffects: params.sideEffects || "",
      weightKgAtInjection: params.weightKgAtInjection ?? null,
      createdAt: Timestamp.now(),
    });
  };

  const updateMedication = async (
    id: string,
    data: Partial<Pick<MedicationRecord, "doseMg" | "injectionSite" | "sideEffects" | "weightKgAtInjection">>
  ) => {
    await updateDoc(doc(db, "medications", id), data);
  };

  const deleteMedication = async (id: string) => {
    await deleteDoc(doc(db, "medications", id));
  };

  // 마지막 주사 + 누적 횟수 (대시보드 카드용)
  const lastMedication = useMemo(() => {
    if (medications.length === 0) return undefined;
    return [...medications].sort((a, b) => b.date.localeCompare(a.date))[0];
  }, [medications]);

  return {
    medications,
    loading,
    lastMedication,
    totalCount: medications.length,
    addMedication,
    updateMedication,
    deleteMedication,
  };
}
