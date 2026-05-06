"use client";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import Modal, { inputClass, labelClass, PrimaryButton, SecondaryButton } from "./Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  defaultDate?: string;
  onSave: (params: {
    date: string;
    duration: number;
    type?: string;
    caloriesBurned?: number;
    notes?: string;
  }) => Promise<void>;
}

const WORKOUT_TYPES = ["걷기", "달리기", "자전거", "수영", "헬스", "홈트", "기타"];

const MET: Record<string, number> = {
  걷기: 3.5, 달리기: 8.0, 자전거: 6.0, 수영: 7.0,
  헬스: 5.0, 홈트: 4.5, 기타: 4.0,
};

export default function WorkoutModal({ open, onClose, defaultDate, onSave }: Props) {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [type, setType] = useState("걷기");
  const [duration, setDuration] = useState("");
  const [calories, setCalories] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDate(defaultDate || format(new Date(), "yyyy-MM-dd"));
      setType("걷기");
      setDuration("");
      setCalories("");
      setNotes("");
    }
  }, [open, defaultDate]);

  useEffect(() => {
    if (duration && type && !calories) {
      const min = parseInt(duration);
      if (!isNaN(min) && min > 0) {
        const met = MET[type] ?? 4;
        const kcal = Math.round((met * 98 * min) / 60);
        setCalories(kcal.toString());
      }
    }
  }, [type, duration]); // eslint-disable-line react-hooks/exhaustive-deps

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

        <div>
          <label className={labelClass}>운동 종류</label>
          <div className="flex flex-wrap gap-1.5">
            {WORKOUT_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setType(t);
                  setCalories("");
                }}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                  type === t
                    ? "bg-[var(--color-slate-blue-500)] text-white"
                    : "bg-black/4 dark:bg-white/5 hover:bg-black/8 dark:hover:bg-white/10"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

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
            placeholder="30"
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
            placeholder="강도, 장소 등"
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
