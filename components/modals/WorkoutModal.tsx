"use client";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import Modal from "./Modal";

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

// 대략적 MET 기반 칼로리 추정 (98kg 기준 적당히)
const MET: Record<string, number> = {
  걷기: 3.5,
  달리기: 8.0,
  자전거: 6.0,
  수영: 7.0,
  헬스: 5.0,
  홈트: 4.5,
  기타: 4.0,
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

  // 운동 종류 또는 시간 변경 시 칼로리 자동 추정 (사용자가 수정 가능)
  useEffect(() => {
    if (duration && type && !calories) {
      const min = parseInt(duration);
      if (!isNaN(min) && min > 0) {
        const met = MET[type] ?? 4;
        // METs × 체중(kg) × 시간(시간) - 98kg 가정
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

  const inputCls =
    "w-full bg-amber-50 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-2xl px-4 py-3 outline-none focus:border-blue-500";

  return (
    <Modal open={open} onClose={onClose} title="운동 기록" zIndex={70}>
      <div className="space-y-4">
        <div>
          <label className="text-sm text-stone-500 dark:text-zinc-400 mb-1.5 block">날짜</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputCls}
          />
        </div>

        <div>
          <label className="text-sm text-stone-500 dark:text-zinc-400 mb-1.5 block">
            운동 종류
          </label>
          <div className="flex flex-wrap gap-2">
            {WORKOUT_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setType(t);
                  setCalories(""); // 재계산 트리거
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  type === t
                    ? "bg-blue-500 text-white"
                    : "bg-amber-100 dark:bg-zinc-800 hover:bg-amber-200 dark:hover:bg-zinc-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-stone-500 dark:text-zinc-400 mb-1.5 block">
            시간 (분)
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={duration}
            onChange={(e) => {
              setDuration(e.target.value);
              setCalories(""); // 재계산
            }}
            placeholder="30"
            className={`${inputCls} text-2xl font-semibold`}
            autoFocus
          />
        </div>

        <div>
          <label className="text-sm text-stone-500 dark:text-zinc-400 mb-1.5 block">
            소모 칼로리 (자동 추정)
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            placeholder="자동 계산됨"
            className={inputCls}
          />
        </div>

        <div>
          <label className="text-sm text-stone-500 dark:text-zinc-400 mb-1.5 block">
            메모 (선택)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="강도, 장소 등"
            rows={2}
            className={`${inputCls} resize-none`}
          />
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={onClose}
          className="flex-1 py-3.5 rounded-2xl bg-stone-200 dark:bg-zinc-800"
        >
          취소
        </button>
        <button
          onClick={submit}
          disabled={saving}
          className="flex-1 py-3.5 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
        >
          {saving ? "저장 중..." : "기록"}
        </button>
      </div>
    </Modal>
  );
}
