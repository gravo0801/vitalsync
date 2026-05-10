"use client";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import Modal, { inputClass, labelClass, PrimaryButton, SecondaryButton } from "./Modal";
import type { MealType } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  defaultDate?: string;
  onSave: (params: {
    date: string;
    mealType: MealType;
    calories: number | null;
    proteinG?: number | null;
    content?: string;
    photo?: File | null;
  }) => Promise<void>;
}

const MEAL_TYPES: MealType[] = ["아침", "점심", "저녁", "간식"];

export default function MealModal({ open, onClose, defaultDate, onSave }: Props) {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [mealType, setMealType] = useState<MealType>("아침");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [content, setContent] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDate(defaultDate || format(new Date(), "yyyy-MM-dd"));
      const h = new Date().getHours();
      setMealType(h < 10 ? "아침" : h < 15 ? "점심" : h < 20 ? "저녁" : "간식");
      setCalories("");
      setProtein("");
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
        proteinG: protein ? parseFloat(protein) : null,
        content,
        photo,
      });
      toast.success("저장되었습니다");
      onClose();
    } catch (e) {
      console.error("[MealModal] save failed:", e);
      toast.error("저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="식사 기록"
      subtitle="오늘 무엇을 드셨나요?"
      zIndex={60}
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
          <label className={labelClass}>식사 종류</label>
          <div className="grid grid-cols-4 gap-1.5">
            {MEAL_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setMealType(t)}
                className={`py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  mealType === t
                    ? "bg-[var(--color-terra-500)] text-white"
                    : "bg-black/4 dark:bg-white/5 hover:bg-black/8 dark:hover:bg-white/10"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>식사 내용</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="현미밥 1공기, 닭가슴살 150g, 샐러드..."
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelClass}>칼로리 (kcal)</label>
            <input
              type="number"
              inputMode="numeric"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="650"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              단백질 (g) <span className="text-[var(--color-sage-600)]">★</span>
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              placeholder="35"
              className={inputClass}
            />
          </div>
        </div>

        <div className="text-[11px] text-[color:var(--muted)] -mt-2">
          💡 PT + GLP-1 복용 중에는 단백질 추적이 매우 중요합니다 (목표 체중 × 1.6g/일)
        </div>

        <div>
          <label className={labelClass}>사진 (선택)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0] || null)}
            className="w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-black/5 dark:file:bg-white/8 file:text-[color:var(--foreground)] hover:file:bg-black/8"
          />
          {photo && (
            <p className="text-[var(--color-sage-600)] text-xs mt-2">📎 {photo.name}</p>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-6">
        <SecondaryButton onClick={onClose}>취소</SecondaryButton>
        <PrimaryButton onClick={submit} disabled={saving} color="terra">
          {saving ? "저장 중..." : "기록"}
        </PrimaryButton>
      </div>
    </Modal>
  );
}
