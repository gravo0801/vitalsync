"use client";
import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc, Timestamp } from "firebase/firestore";
import { db, PERSONAL_USER_ID } from "@/lib/firebase";
import type { UserProfile } from "@/types";

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "profiles", PERSONAL_USER_ID),
      (snap) => {
        setProfile(snap.exists() ? (snap.data() as UserProfile) : null);
        setLoading(false);
      },
      (err) => {
        console.error("[useProfile] onSnapshot error:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const saveProfile = async (data: UserProfile) => {
    await setDoc(doc(db, "profiles", PERSONAL_USER_ID), {
      ...data,
      updatedAt: Timestamp.now(),
    });
  };

  return { profile, loading, saveProfile };
}
