"use client";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import Modal from "./Modal";
import type { MealType } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  defaultDate?: string;
  onSave: (params: {
    date: string;
    mealType: MealType;
    calories: number | null;
    content?: string;
    photo?: File | null;
  }) => Promise<void>;
}

const MEAL_TYPES: MealType[] = ["아침", "점심", "저녁", "간식"];

export default function MealModal({ open, onClose, defaultDate, onSave }: Props) {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [mealType, setMealType] = useState<MealType>("아침");
  const [calories, setCalories] = useState("");
  const [content, setContent] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDate(defaultDate || format(new Date(), "yyyy-MM-dd"));
      // 시간대에 따라 기본 식사 타입 추정
      const h = new Date().getHours();
      setMealType(h < 10 ? "아침" : h < 15 ? "점심" : h < 20 ? "저녁" : "간식");
      setCalories("");
      setContent("");
      setPhoto(null);
    }
  }, [open, defaultDate]);

  const submit = async () => {
    setSaving(true);
    try {
      await onSave({
        date,
        mealType,
        calories: calories ? parseInt(calories) : null,
        content,
        photo,
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
    "w-full bg-amber-50 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-2xl px-4 py-3 outline-none focus:border-orange-500";

  return (
    <Modal open={open} onClose={onClose} title="식사 기록" zIndex={60}>
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
            식사 종류
          </label>
          <div className="grid grid-cols-4 gap-2">
            {MEAL_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setMealType(t)}
                className={`py-2.5 rounded-xl text-sm font-medium transition ${
                  mealType === t
                    ? "bg-orange-500 text-white"
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
            식사 내용
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="현미밥 1공기, 닭가슴살 150g, 샐러드..."
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </div>

        <div>
          <label className="text-sm text-stone-500 dark:text-zinc-400 mb-1.5 block">
            칼로리 (선택, kcal)
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            placeholder="650"
            className={inputCls}
          />
        </div>

        <div>
          <label className="text-sm text-stone-500 dark:text-zinc-400 mb-1.5 block">
            사진 (선택)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0] || null)}
            className="w-full text-sm"
          />
          {photo && (
            <p className="text-emerald-500 text-xs mt-2">📎 {photo.name}</p>
          )}
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
          className="flex-1 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
        >
          {saving ? "저장 중..." : "기록"}
        </button>
      </div>
    </Modal>
  );
}
