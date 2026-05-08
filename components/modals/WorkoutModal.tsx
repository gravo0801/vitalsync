"use client";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import Modal, { inputClass, labelClass, PrimaryButton, SecondaryButton } from "./Modal";
import type { WorkoutCategory, BodyPart } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  defaultDate?: string;
  onSave: (params: {
    date: string;
    duration: number;
    type?: string;
    category?: WorkoutCategory;
    bodyPart?: BodyPart;
    caloriesBurned?: number;
    notes?: string;
  }) => Promise<void>;
}

// 카테고리별 운동 종류 + MET 값 (98kg 기준)
const CATEGORIES: {
  key: WorkoutCategory;
  label: string;
  types: { name: string; met: number }[];
}[] = [
  {
    key: "pt",
    label: "PT",
    types: [
      { name: "PT 세션", met: 5.5 },
    ],
  },
  {
    key: "self_strength",
    label: "혼자 헬스",
    types: [
      { name: "헬스", met: 5.0 },
      { name: "홈트", met: 4.5 },
    ],
  },
  {
    key: "cardio",
    label: "유산소",
    types: [
      { name: "걷기", met: 3.5 },
      { name: "달리기", met: 8.0 },
      { name: "자전거", met: 6.0 },
      { name: "수영", met: 7.0 },
    ],
  },
  {
    key: "etc",
    label: "기타",
    types: [{ name: "기타", met: 4.0 }],
  },
];

const BODY_PARTS: BodyPart[] = ["상체", "하체", "전신", "코어"];

export default function WorkoutModal({ open, onClose, defaultDate, onSave }: Props) {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [category, setCategory] = useState<WorkoutCategory>("pt");
  const [type, setType] = useState("PT 세션");
  const [bodyPart, setBodyPart] = useState<BodyPart>("전신");
  const [duration, setDuration] = useState("");
  const [calories, setCalories] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDate(defaultDate || format(new Date(), "yyyy-MM-dd"));
      setCategory("pt");
      setType("PT 세션");
      setBodyPart("전신");
      setDuration("");
      setCalories("");
      setNotes("");
    }
  }, [open, defaultDate]);

  // 종류 자동 추정
  useEffect(() => {
    const types = CATEGORIES.find((c) => c.key === category)?.types ?? [];
    if (types.length > 0 && !types.some((t) => t.name === type)) {
      setType(types[0].name);
    }
  }, [category]); // eslint-disable-line react-hooks/exhaustive-deps

  // 칼로리 자동 추정
  useEffect(() => {
    if (duration && type && !calories) {
      const min = parseInt(duration);
      if (!isNaN(min) && min > 0) {
        const cat = CATEGORIES.find((c) => c.key === category);
        const t = cat?.types.find((x) => x.name === type);
        const met = t?.met ?? 4;
        const kcal = Math.round((met * 98 * min) / 60);
        setCalories(kcal.toString());
      }
    }
  }, [type, duration, category]); // eslint-disable-line react-hooks/exhaustive-deps

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
    setSaving(true);
    try {
      await onSave({
        date,
        duration: min,
        type,
        category,
        bodyPart: category === "pt" || category === "self_strength" ? bodyPart : undefined,
        caloriesBurned: calories ? parseInt(calories) : undefined,
        notes,
      });
      toast.success("저장되었습니다");
      onClose();
    } catch {
      toast.error("저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  const currentTypes = CATEGORIES.find((c) => c.key === category)?.types ?? [];
  const showBodyPart = category === "pt" || category === "self_strength";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="운동 기록"
      subtitle="오늘의 운동을 남겨보세요"
      zIndex={70}
    >
      <div className="space-y-4">
        <div>
          <label className={labelClass}>날짜</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* 카테고리 */}
        <div>
          <label className={labelClass}>카테고리</label>
          <div className="grid grid-cols-4 gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => {
                  setCategory(c.key);
                  setCalories("");
                }}
                className={`py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  category === c.key
                    ? c.key === "pt"
                      ? "bg-[var(--color-mauve-500)] text-white"
                      : "bg-[var(--color-slate-blue-500)] text-white"
                    : "bg-black/4 dark:bg-white/5 hover:bg-black/8 dark:hover:bg-white/10"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          {category === "pt" && (
            <p className="text-[11px] text-[var(--color-mauve-500)] mt-1.5">
              💪 GLP-1 복용 중 PT는 근손실 방지 핵심입니다
            </p>
          )}
        </div>

        {/* 운동 종류 */}
        {currentTypes.length > 1 && (
          <div>
            <label className={labelClass}>운동 종류</label>
            <div className="flex flex-wrap gap-1.5">
              {currentTypes.map((t) => (
                <button
                  key={t.name}
                  onClick={() => {
                    setType(t.name);
                    setCalories("");
                  }}
                  className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                    type === t.name
                      ? "bg-[var(--color-slate-blue-500)] text-white"
                      : "bg-black/4 dark:bg-white/5 hover:bg-black/8 dark:hover:bg-white/10"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 부위 (PT/혼자 헬스만) */}
        {showBodyPart && (
          <div>
            <label className={labelClass}>운동 부위</label>
            <div className="grid grid-cols-4 gap-1.5">
              {BODY_PARTS.map((p) => (
                <button
                  key={p}
                  onClick={() => setBodyPart(p)}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    bodyPart === p
                      ? "bg-[var(--color-mauve-500)] text-white"
                      : "bg-black/4 dark:bg-white/5"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
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
            }}
            placeholder="60"
            className={`${inputClass} text-2xl font-semibold tabular`}
            autoFocus
          />
        </div>

        <div>
          <label className={labelClass}>소모 칼로리 (자동 추정)</label>
          <input
            type="number"
            inputMode="numeric"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            placeholder="자동 계산됨"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>메모 (선택)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="강도, 무게, 세트, 컨디션 등"
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      <div className="flex gap-2 mt-6">
        <SecondaryButton onClick={onClose}>취소</SecondaryButton>
        <PrimaryButton onClick={submit} disabled={saving} color="slate-blue">
          {saving ? "저장 중..." : "기록"}
        </PrimaryButton>
      </div>
    </Modal>
  );
}
