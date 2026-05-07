"use client";
import { useEffect, useState } from "react";
import {
  collection, onSnapshot, query, where,
  addDoc, deleteDoc, doc, Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage, PERSONAL_USER_ID } from "@/lib/firebase";
import type { InbodyRecord } from "@/types";

export function useInbody() {
  const [records, setRecords] = useState<InbodyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "inbody"),
      where("userId", "==", PERSONAL_USER_ID)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as InbodyRecord));
        // 측정일 오름차순
        docs.sort((a, b) => a.measuredAt.localeCompare(b.measuredAt));
        setRecords(docs);
        setLoading(false);
      },
      (err) => {
        console.error("[useInbody] onSnapshot error:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const addInbody = async (
    data: Omit<InbodyRecord, "id" | "createdAt" | "fileURL">,
    file?: File | null
  ) => {
    let fileURL: string | undefined;
    if (file) {
      const storageRef = ref(
        storage,
        `inbody/${PERSONAL_USER_ID}/${Date.now()}_${file.name}`
      );
      await uploadBytes(storageRef, file);
      fileURL = await getDownloadURL(storageRef);
    }
    await addDoc(collection(db, "inbody"), {
      ...data,
      userId: PERSONAL_USER_ID,
      fileURL,
      createdAt: Timestamp.now(),
    });
  };

  const deleteInbody = async (record: InbodyRecord) => {
    if (record.fileURL) {
      try {
        await deleteObject(ref(storage, record.fileURL));
      } catch {
        // ignore
      }
    }
    await deleteDoc(doc(db, "inbody", record.id));
  };

  return { records, loading, addInbody, deleteInbody };
}
