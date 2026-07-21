"use client";
import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { CopyPlus, Dumbbell, Plus, Trash2, User } from "lucide-react";
import Modal, { inputClass, labelClass, PrimaryButton, SecondaryButton } from "./Modal";
import type {
  CalorieEstimate,
  WorkoutCategory,
  WorkoutExercise,
  WorkoutIntensity,
} from "@/types";
import {
  calculateWorkoutVolume,
  estimateWorkoutCalories,
  INTENSITY_LABEL,
  isStrengthWorkout,
  STRENGTH_MET,
  totalWorkoutReps,
  totalWorkoutSets,
} from "@/lib/workoutCalculations";

interface Props {
  open: boolean;
  onClose: () => void;
  defaultDate?: string;
  nextPTNumber: number;
  bodyWeightKg?: number;
  onSave: (params: {
    date: string;
    duration: number;
    type?: string;
    category?: WorkoutCategory;
    ptNumber?: number;
    lessonContent?: string;
    exercises?: WorkoutExercise[];
    intensity?: WorkoutIntensity;
    calorieEstimate?: CalorieEstimate;
    caloriesBurned?: number;
    notes?: string;
  }) => Promise<void>;
}

const PERSONAL_TYPES = ["걷기", "달리기", "자전거", "수영", "헬스", "홈트", "기타"];
const PT_TYPES = ["근력", "유산소", "코어", "스트레칭", "복합", "기타"];

interface SetDraft {
  id: string;
  weightKg: string;
  reps: string;
}

interface ExerciseDraft {
  id: string;
  name: string;
  sets: SetDraft[];
}

function draftId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createSet(copy?: SetDraft): SetDraft {
  return {
    id: draftId("set"),
    weightKg: copy?.weightKg ?? "",
    reps: copy?.reps ?? "",
  };
}

function createExercise(): ExerciseDraft {
  return { id: draftId("exercise"), name: "", sets: [createSet()] };
}

function normalizeExercises(drafts: ExerciseDraft[]): WorkoutExercise[] {
  return drafts
    .map((exercise) => ({
      id: exercise.id,
      name: exercise.name.trim(),
      sets: exercise.sets
        .map((set) => ({
          weightKg: set.weightKg.trim() === "" ? null : Number(set.weightKg),
          reps: Number(set.reps),
        }))
        .filter((set) => Number.isFinite(set.reps) && set.reps > 0),
    }))
    .filter((exercise) => exercise.name && exercise.sets.length > 0);
}

export default function WorkoutModal({
  open, onClose, defaultDate, nextPTNumber, bodyWeightKg, onSave,
}: Props) {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [category, setCategory] = useState<WorkoutCategory>("personal");
  const [type, setType] = useState("걷기");
  const [duration, setDuration] = useState("");
  const [ptNumber, setPtNumber] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [intensity, setIntensity] = useState<WorkoutIntensity>("moderate");
  const [exercises, setExercises] = useState<ExerciseDraft[]>([]);
  const [calories, setCalories] = useState("");
  const [caloriesManuallyEdited, setCaloriesManuallyEdited] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDate(defaultDate || format(new Date(), "yyyy-MM-dd"));
      setCategory("personal");
      setType("걷기");
      setDuration("");
      setPtNumber("");
      setLessonContent("");
      setIntensity("moderate");
      setExercises([]);
      setCalories("");
      setCaloriesManuallyEdited(false);
      setNotes("");
    }
  }, [open, defaultDate]);

  // PT 모드 진입 시 회차 기본값을 다음 회차로
  useEffect(() => {
    if (category === "PT" && !ptNumber) {
      setPtNumber(String(nextPTNumber));
    }
    if (category !== "PT") setPtNumber("");
  }, [category, nextPTNumber]); // eslint-disable-line react-hooks/exhaustive-deps

  // 카테고리 변경 시 type 기본값 변경
  useEffect(() => {
    if (category === "PT") {
      setType("근력");
      setExercises((current) => current.length > 0 ? current : [createExercise()]);
    } else {
      setType("걷기");
    }
    setCalories("");
    setCaloriesManuallyEdited(false);
  }, [category]);

  // 자동 칼로리 추정
  useEffect(() => {
    if (!caloriesManuallyEdited && duration && type) {
      const min = parseInt(duration);
      if (!isNaN(min) && min > 0) {
        const w = bodyWeightKg && bodyWeightKg > 0 ? bodyWeightKg : 70;
        const result = estimateWorkoutCalories({
          bodyWeightKg: w,
          durationMin: min,
          type,
          intensity,
        });
        setCalories(result.calories.toString());
      }
    }
  }, [type, duration, intensity, bodyWeightKg, caloriesManuallyEdited]);

  const normalizedExercises = useMemo(() => normalizeExercises(exercises), [exercises]);
  const strengthMode = isStrengthWorkout(type);
  const totalSets = totalWorkoutSets(normalizedExercises);
  const totalReps = totalWorkoutReps(normalizedExercises);
  const totalVolume = calculateWorkoutVolume(normalizedExercises);

  const submit = async () => {
    if (!duration) {
      toast.error("운동 시간을 입력해주세요");
      return;
    }
    const min = parseInt(duration);
    if (isNaN(min) || min <= 0) {
      toast.error("올바른 시간을 입력해주세요");
      return;
    }
    if (strengthMode) {
      const unnamedWithValues = exercises.some(
        (exercise) => !exercise.name.trim() && exercise.sets.some((set) => set.weightKg || set.reps),
      );
      const invalidSet = exercises.some((exercise) =>
        exercise.name.trim() && exercise.sets.some((set) => {
          const weight = set.weightKg.trim() === "" ? 0 : Number(set.weightKg);
          const reps = Number(set.reps);
          return !Number.isFinite(weight) || weight < 0 || !Number.isFinite(reps) || reps <= 0;
        }),
      );
      if (unnamedWithValues) {
        toast.error("운동 종목명을 입력해주세요");
        return;
      }
      if (invalidSet || normalizedExercises.length === 0) {
        toast.error("종목별 중량과 횟수를 정확히 입력해주세요");
        return;
      }
    }
    setSaving(true);
    try {
      const ptN = category === "PT" && ptNumber ? parseInt(ptNumber) : undefined;
      if (ptN !== undefined && (isNaN(ptN) || ptN <= 0)) {
        toast.error("올바른 회차를 입력해주세요");
        setSaving(false);
        return;
      }
      const weightForEstimate = bodyWeightKg && bodyWeightKg > 0 ? bodyWeightKg : 70;
      const estimate = estimateWorkoutCalories({
        bodyWeightKg: weightForEstimate,
        durationMin: min,
        type,
        intensity,
      });
      await onSave({
        date,
        duration: min,
        type,
        category,
        ptNumber: ptN,
        lessonContent: category === "PT" ? lessonContent : undefined,
        exercises: strengthMode ? normalizedExercises : [],
        intensity,
        calorieEstimate: caloriesManuallyEdited
          ? undefined
          : {
              method: "met",
              met: estimate.met,
              bodyWeightKg: weightForEstimate,
              durationMin: min,
            },
        caloriesBurned: calories ? parseInt(calories) : undefined,
        notes,
      });
      toast.success("저장되었습니다");
      onClose();
    } catch (e) {
      console.error("[WorkoutModal] save failed:", e);
      toast.error("저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  const TYPES = category === "PT" ? PT_TYPES : PERSONAL_TYPES;

  const selectType = (nextType: string) => {
    setType(nextType);
    setCalories("");
    setCaloriesManuallyEdited(false);
    if (isStrengthWorkout(nextType) && exercises.length === 0) {
      setExercises([createExercise()]);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="운동 기록"
      subtitle="오늘의 운동을 남겨보세요"
      zIndex={70}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* ⭐ 운동 유형 - PT vs 개인운동 */}
        <div>
          <label className={labelClass}>운동 유형</label>
          <div className="grid grid-cols-2 gap-2">
            <CategoryButton
              active={category === "personal"}
              onClick={() => setCategory("personal")}
              color="sage"
              icon={<User size={16} />}
              title="개인 운동"
              subtitle="혼자 운동"
            />
            <CategoryButton
              active={category === "PT"}
              onClick={() => setCategory("PT")}
              color="wine"
              icon={<Dumbbell size={16} />}
              title="PT"
              subtitle="퍼스널 트레이닝"
            />
          </div>
        </div>

        <div className={category === "PT" ? "grid grid-cols-2 gap-2" : ""}>
          <div>
            <label className={labelClass}>날짜</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </div>
          {category === "PT" && (
            <div>
              <label className={labelClass}>회차</label>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={ptNumber}
                onChange={(e) => setPtNumber(e.target.value)}
                placeholder={String(nextPTNumber)}
                className={`${inputClass} tabular`}
              />
            </div>
          )}
        </div>

        <div>
          <label className={labelClass}>
            {category === "PT" ? "PT 종목" : "운동 종류"}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {TYPES.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => selectType(t)}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                  type === t
                    ? category === "PT"
                      ? "bg-[var(--color-wine-500)] text-white"
                      : "bg-[var(--color-slate-blue-500)] text-white"
                    : "bg-black/4 dark:bg-white/5 hover:bg-black/8 dark:hover:bg-white/10"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {strengthMode && (
          <>
            <div>
              <label className={labelClass}>운동 강도</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(INTENSITY_LABEL) as WorkoutIntensity[]).map((level) => (
                  <button
                    type="button"
                    key={level}
                    onClick={() => {
                      setIntensity(level);
                      setCaloriesManuallyEdited(false);
                    }}
                    className={`rounded-xl border px-2 py-2.5 text-center transition-colors ${
                      intensity === level
                        ? "border-[var(--color-slate-blue-500)] bg-[var(--color-slate-blue-500)]/10 text-[var(--color-slate-blue-600)] dark:text-[var(--color-slate-blue-400)]"
                        : "border-black/8 bg-black/[0.02] text-[color:var(--muted-foreground)] dark:border-white/10 dark:bg-white/[0.03]"
                    }`}
                  >
                    <span className="block text-xs font-semibold">{INTENSITY_LABEL[level]}</span>
                    <span className="block text-[10px] tabular text-[color:var(--muted)]">{STRENGTH_MET[level]} MET</span>
                  </button>
                ))}
              </div>
            </div>

            <StrengthExerciseEditor
              exercises={exercises}
              onChange={setExercises}
              totalSets={totalSets}
              totalReps={totalReps}
              totalVolume={totalVolume}
            />
          </>
        )}

        <div>
          <label className={labelClass}>시간 (분)</label>
          <input
            type="number"
            inputMode="numeric"
            value={duration}
            onChange={(e) => {
              setDuration(e.target.value);
              setCalories("");
              setCaloriesManuallyEdited(false);
            }}
            placeholder={category === "PT" ? "60" : "30"}
            className={`${inputClass} text-2xl font-semibold tabular`}
            autoFocus
          />
        </div>

        <div>
          <label className={labelClass}>추정 소모 칼로리</label>
          <input
            type="number"
            inputMode="numeric"
            value={calories}
            onChange={(e) => {
              setCalories(e.target.value);
              setCaloriesManuallyEdited(true);
            }}
            placeholder="자동 계산됨"
            className={inputClass}
          />
          <p className="mt-1.5 text-[10px] leading-relaxed text-[color:var(--muted)]">
            체중 × 운동시간 × MET로 계산한 참고값이며 직접 수정할 수도 있습니다. 중량·횟수·세트는 칼로리가 아닌 근력운동 총볼륨으로 별도 집계됩니다.
          </p>
        </div>

        {category === "PT" && (
          <div>
            <label className={labelClass}>오늘 수업 내용 (선택)</label>
            <textarea
              value={lessonContent}
              onChange={(e) => setLessonContent(e.target.value)}
              placeholder="예) 하체 위주 — 스쿼트 5x10, 데드리프트 4x6, 레그프레스 3x12"
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>
        )}

        <div>
          <label className={labelClass}>
            {category === "PT" ? "느낀 점 / 일기 (선택)" : "메모 (선택)"}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              category === "PT"
                ? "오늘 강도는 어땠는지, 컨디션, 트레이너 코멘트, 다음 목표 등 자유롭게"
                : "장소, 강도 등"
            }
            rows={category === "PT" ? 5 : 2}
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      <div className="flex gap-2 mt-6">
        <SecondaryButton onClick={onClose}>취소</SecondaryButton>
        <PrimaryButton
          onClick={submit}
          disabled={saving}
          color={category === "PT" ? "wine" : "slate-blue"}
        >
          {saving ? "저장 중..." : "기록"}
        </PrimaryButton>
      </div>
    </Modal>
  );
}

function StrengthExerciseEditor({
  exercises,
  onChange,
  totalSets,
  totalReps,
  totalVolume,
}: {
  exercises: ExerciseDraft[];
  onChange: React.Dispatch<React.SetStateAction<ExerciseDraft[]>>;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
}) {
  const updateExerciseName = (exerciseId: string, name: string) => {
    onChange((current) => current.map((exercise) =>
      exercise.id === exerciseId ? { ...exercise, name } : exercise,
    ));
  };

  const updateSet = (
    exerciseId: string,
    setId: string,
    field: "weightKg" | "reps",
    value: string,
  ) => {
    onChange((current) => current.map((exercise) =>
      exercise.id === exerciseId
        ? {
            ...exercise,
            sets: exercise.sets.map((set) =>
              set.id === setId ? { ...set, [field]: value } : set,
            ),
          }
        : exercise,
    ));
  };

  const addSet = (exerciseId: string) => {
    onChange((current) => current.map((exercise) => {
      if (exercise.id !== exerciseId) return exercise;
      const lastSet = exercise.sets[exercise.sets.length - 1];
      return { ...exercise, sets: [...exercise.sets, createSet(lastSet)] };
    }));
  };

  const removeSet = (exerciseId: string, setId: string) => {
    onChange((current) => current.map((exercise) =>
      exercise.id === exerciseId
        ? { ...exercise, sets: exercise.sets.filter((set) => set.id !== setId) }
        : exercise,
    ));
  };

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <label className="text-xs font-medium text-[color:var(--muted-foreground)]">
            종목별 세트 상세 <span className="text-[var(--color-wine-500)]">필수</span>
          </label>
          <p className="mt-0.5 text-[10px] text-[color:var(--muted)]">
            체중운동은 중량을 비워두고 횟수만 입력하세요.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange((current) => [...current, createExercise()])}
          className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-slate-blue-500)]/10 px-2.5 py-1.5 text-[11px] font-semibold text-[var(--color-slate-blue-600)] dark:text-[var(--color-slate-blue-400)]"
        >
          <Plus size={12} /> 종목 추가
        </button>
      </div>

      <div className="space-y-3">
        {exercises.map((exercise, exerciseIndex) => (
          <div
            key={exercise.id}
            className="rounded-2xl border border-black/8 bg-black/[0.015] p-3 dark:border-white/10 dark:bg-white/[0.025]"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[var(--color-slate-blue-500)] text-[10px] font-semibold text-white tabular">
                {exerciseIndex + 1}
              </span>
              <input
                value={exercise.name}
                onChange={(event) => updateExerciseName(exercise.id, event.target.value)}
                placeholder="운동 종목명 (예: Seated chest press)"
                className={`${inputClass} py-2 text-sm font-medium`}
              />
              <button
                type="button"
                onClick={() => onChange((current) => current.filter((item) => item.id !== exercise.id))}
                className="shrink-0 rounded-lg p-2 text-[color:var(--muted)] hover:bg-[var(--color-wine-500)]/10 hover:text-[var(--color-wine-500)]"
                aria-label={`${exercise.name || `${exerciseIndex + 1}번 종목`} 삭제`}
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,1fr)_2rem] gap-1.5 px-1 text-center text-[9px] font-medium text-[color:var(--muted)]">
              <span>세트</span>
              <span>중량 kg</span>
              <span>횟수</span>
              <span />
            </div>
            <div className="mt-1 space-y-1.5">
              {exercise.sets.map((set, setIndex) => (
                <div
                  key={set.id}
                  className="grid grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,1fr)_2rem] items-center gap-1.5"
                >
                  <span className="text-center text-xs font-semibold text-[color:var(--muted-foreground)] tabular">
                    {setIndex + 1}
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={0.5}
                    value={set.weightKg}
                    onChange={(event) => updateSet(exercise.id, set.id, "weightKg", event.target.value)}
                    placeholder="체중"
                    aria-label={`${exercise.name || `${exerciseIndex + 1}번 종목`} ${setIndex + 1}세트 중량`}
                    className={`${inputClass} px-2 py-2 text-center text-sm tabular`}
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={set.reps}
                    onChange={(event) => updateSet(exercise.id, set.id, "reps", event.target.value)}
                    placeholder="회"
                    aria-label={`${exercise.name || `${exerciseIndex + 1}번 종목`} ${setIndex + 1}세트 횟수`}
                    className={`${inputClass} px-2 py-2 text-center text-sm tabular`}
                  />
                  <button
                    type="button"
                    onClick={() => removeSet(exercise.id, set.id)}
                    disabled={exercise.sets.length === 1}
                    className="rounded-md p-1.5 text-[color:var(--muted)] hover:text-[var(--color-wine-500)] disabled:opacity-25"
                    aria-label={`${setIndex + 1}세트 삭제`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => addSet(exercise.id)}
              className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-[var(--color-slate-blue-600)] dark:text-[var(--color-slate-blue-400)]"
            >
              <CopyPlus size={11} /> 직전 중량·횟수로 세트 추가
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-[var(--color-slate-blue-500)]/[0.07] p-3 text-center">
        <MiniTotal label="총 세트" value={`${totalSets}세트`} />
        <MiniTotal label="총 반복" value={`${totalReps}회`} />
        <MiniTotal label="총볼륨" value={`${Math.round(totalVolume).toLocaleString()}kg`} />
      </div>
    </div>
  );
}

function MiniTotal({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] text-[color:var(--muted)]">{label}</div>
      <div className="mt-0.5 text-xs font-semibold tabular">{value}</div>
    </div>
  );
}

function CategoryButton({
  active, onClick, color, icon, title, subtitle,
}: {
  active: boolean;
  onClick: () => void;
  color: "sage" | "wine";
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  const colorVar = `var(--color-${color}-500)`;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative px-4 py-3 rounded-xl border-2 text-left transition-all
        ${active
          ? "bg-white dark:bg-[var(--color-ink-900)] shadow-sm"
          : "bg-black/3 dark:bg-white/3 border-transparent hover:border-black/8 dark:hover:border-white/8"
        }
      `}
      style={active ? { borderColor: colorVar } : undefined}
    >
      <div className="flex items-center gap-2 mb-0.5">
        <span style={{ color: active ? colorVar : "var(--muted)" }}>{icon}</span>
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <div className="text-[11px] text-[color:var(--muted)] ml-6">{subtitle}</div>
    </button>
  );
}
