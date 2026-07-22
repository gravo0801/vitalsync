"use client";

import { FormEvent, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { ArrowLeft, Dumbbell, Gauge, KeyRound, Timer } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import {
  calculateExerciseVolume,
  calculateWorkoutVolume,
  formatStrengthSet,
  summarizeCardio,
  totalWorkoutSets,
} from "@/lib/workoutCalculations";
import type { WorkoutRecord } from "@/types";

const STORAGE_KEY = "vitalsync-workout-api-key";

export default function WorkoutDetailPage() {
  const { workoutId } = useParams<{ workoutId: string }>();
  const [apiKey, setApiKey] = useState("");
  const [workout, setWorkout] = useState<WorkoutRecord | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadWorkout(key: string) {
    if (!workoutId || !key.trim()) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/workouts/${encodeURIComponent(workoutId)}`, {
        headers: { Authorization: `Bearer ${key.trim()}` },
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "운동 기록을 불러오지 못했습니다.");
      sessionStorage.setItem(STORAGE_KEY, key.trim());
      setWorkout(data.workout);
    } catch (loadError) {
      setWorkout(null);
      setError(loadError instanceof Error ? loadError.message : "운동 기록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const savedKey = sessionStorage.getItem(STORAGE_KEY) || "";
    if (savedKey) {
      setApiKey(savedKey);
      void loadWorkout(savedKey);
    }
    // workoutId changes only when this route changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutId]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadWorkout(apiKey);
  }

  if (!workout) {
    return (
      <main className="min-h-screen px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-md rounded-2xl border border-black/8 bg-white p-6 dark:border-white/8 dark:bg-[var(--color-ink-900)]">
          <KeyRound className="text-[var(--color-slate-blue-500)]" size={24} />
          <h1 className="mt-4 text-xl font-semibold">운동 상세 기록</h1>
          <p className="mt-2 text-sm leading-relaxed text-[color:var(--muted-foreground)]">
            개인 운동 기록을 보호하기 위해 VitalSync 운동 API 키가 필요합니다.
          </p>
          <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
            <label className="block text-xs font-medium" htmlFor="workout-api-key">API 키</label>
            <input
              id="workout-api-key"
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              className="w-full rounded-xl border border-black/10 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--color-slate-blue-500)] dark:border-white/10"
              placeholder="GPT Action에 등록한 Bearer 키"
              required
            />
            {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[var(--color-slate-blue-500)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? "불러오는 중…" : "상세 기록 확인"}
            </button>
          </form>
          <Link href="/" className="mt-5 inline-flex items-center gap-1 text-xs text-[color:var(--muted)]">
            <ArrowLeft size={13} /> 대시보드로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  const exercises = workout.exercises ?? [];
  const cardioExercises = workout.cardioExercises ?? [];
  const totalVolume = calculateWorkoutVolume(exercises);
  const totalSets = totalWorkoutSets(exercises);
  const formattedDate = format(parseISO(workout.date), "yyyy년 M월 d일 (E)", { locale: ko });

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link href={`/?date=${workout.date}`} className="mb-5 inline-flex items-center gap-1.5 text-sm text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]">
          <ArrowLeft size={15} /> 날짜 기록으로 돌아가기
        </Link>
        <section className="overflow-hidden rounded-2xl border border-black/8 bg-white dark:border-white/8 dark:bg-[var(--color-ink-900)]">
          <header className="border-b border-black/6 bg-[var(--color-slate-blue-500)]/[0.07] px-5 py-5 dark:border-white/6 sm:px-6">
            <p className="text-xs font-medium text-[var(--color-slate-blue-600)] dark:text-[var(--color-slate-blue-400)]">{formattedDate}</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{workout.type || "운동 기록"}</h1>
            <p className="mt-1 text-[11px] text-[color:var(--muted)] tabular">ID: {workout.id}</p>
          </header>
          <div className="grid grid-cols-3 gap-px bg-black/6 dark:bg-white/6">
            <Summary icon={<Dumbbell size={14} />} label="근력" value={`${totalSets}세트`} />
            <Summary icon={<Gauge size={14} />} label="총볼륨" value={`${Math.round(totalVolume).toLocaleString()}kg`} />
            <Summary icon={<Timer size={14} />} label={workout.durationDerivedFromCardio ? "유산소 기록" : "운동시간"} value={`${workout.duration}분`} />
          </div>
          <div className="space-y-5 p-5 sm:p-6">
            {exercises.map((exercise) => (
              <section key={exercise.id} className="rounded-xl border border-black/6 p-3.5 dark:border-white/6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold">{exercise.name}</h2>
                  <span className="text-[10px] text-[color:var(--muted)] tabular">{exercise.sets.length}세트 · {Math.round(calculateExerciseVolume(exercise)).toLocaleString()}kg</span>
                </div>
                <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {exercise.sets.map((set, index) => (
                    <div key={`${exercise.id}-${index}`} className="rounded-lg bg-black/[0.035] px-2.5 py-2 text-[11px] dark:bg-white/[0.04]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[color:var(--muted)]">{set.setNumber ?? index + 1}세트</span>
                        <span className="font-semibold tabular">{formatStrengthSet(set)}</span>
                      </div>
                      {set.notes && <p className="mt-1 text-[10px] text-[color:var(--muted)]">{set.notes}</p>}
                    </div>
                  ))}
                </div>
                {exercise.notes && <p className="mt-2 text-[11px] leading-relaxed text-[color:var(--muted-foreground)]">{exercise.notes}</p>}
              </section>
            ))}
            {cardioExercises.map((exercise) => (
              <section key={exercise.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-black/6 p-3.5 dark:border-white/6">
                <h2 className="text-sm font-semibold">{exercise.name}</h2>
                <span className="text-xs text-[color:var(--muted-foreground)] tabular">{summarizeCardio(exercise)}</span>
              </section>
            ))}
            {(workout.lessonContent || workout.notes) && (
              <section className="rounded-xl bg-black/[0.025] p-3.5 text-xs leading-relaxed text-[color:var(--muted-foreground)] dark:bg-white/[0.03]">
                {workout.lessonContent && <p className="whitespace-pre-line">{workout.lessonContent}</p>}
                {workout.notes && <p className="whitespace-pre-line">{workout.notes}</p>}
              </section>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Summary({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white px-3 py-3.5 text-center dark:bg-[var(--color-ink-900)]">
      <div className="flex items-center justify-center gap-1 text-[10px] text-[color:var(--muted)]">{icon} {label}</div>
      <div className="mt-1 text-sm font-semibold tabular">{value}</div>
    </div>
  );
}
