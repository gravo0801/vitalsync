"use client";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Dumbbell, User } from "lucide-react";
import Modal, { inputClass, labelClass, PrimaryButton, SecondaryButton } from "./Modal";
import type { WorkoutCategory } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  defaultDate?: string;
  totalPTCount: number; // 현재까지 PT 누적 횟수 (다음 PT 회차 미리보기용)
  bodyWeightKg?: number;
  onSave: (params: {
    date: string;
    duration: number;
    type?: string;
    category?: WorkoutCategory;
    caloriesBurned?: number;
    notes?: string;
  }) => Promise<void>;
}

const PERSONAL_TYPES = ["걷기", "달리기", "자전거", "수영", "헬스", "홈트", "기타"];
const PT_TYPES = ["근력", "유산소", "코어", "스트레칭", "복합", "기타"];

const MET: Record<string, number> = {
  걷기: 3.5, 달리기: 8.0, 자전거: 6.0, 수영: 7.0,
  헬스: 5.0, 홈트: 4.5, 근력: 5.5, 유산소: 7.0,
  코어: 4.0, 스트레칭: 2.5, 복합: 6.5, 기타: 4.0,
};

export default function WorkoutModal({
  open, onClose, defaultDate, totalPTCount, bodyWeightKg, onSave,
}: Props) {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [category, setCategory] = useState<WorkoutCategory>("personal");
  const [type, setType] = useState("걷기");
  const [duration, setDuration] = useState("");
  const [calories, setCalories] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDate(defaultDate || format(new Date(), "yyyy-MM-dd"));
      setCategory("personal");
      setType("걷기");
      setDuration("");
      setCalories("");
      setNotes("");
    }
  }, [open, defaultDate]);

  // 카테고리 변경 시 type 기본값 변경
  useEffect(() => {
    if (category === "PT") setType("근력");
    else setType("걷기");
    setCalories("");
  }, [category]);

  // 자동 칼로리 추정
  useEffect(() => {
    if (duration && type && !calories) {
      const min = parseInt(duration);
      if (!isNaN(min) && min > 0) {
        const met = MET[type] ?? 4;
        const w = bodyWeightKg && bodyWeightKg > 0 ? bodyWeightKg : 70;
        const kcal = Math.round((met * w * min) / 60);
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
        category,
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
  const nextPTNumber = totalPTCount + 1;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="운동 기록"
      subtitle="오늘의 운동을 남겨보세요"
      zIndex={70}
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
              subtitle={category === "PT" ? `${nextPTNumber}회차` : "퍼스널 트레이닝"}
            />
          </div>
        </div>

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
          <label className={labelClass}>
            {category === "PT" ? "PT 종목" : "운동 종류"}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setType(t);
                  setCalories("");
                }}
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
            placeholder={category === "PT" ? "60" : "30"}
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
            placeholder={
              category === "PT"
                ? "트레이너, 강도, 부위 등"
                : "장소, 강도 등"
            }
            rows={2}
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
