"use client";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import Modal, { inputClass, labelClass, PrimaryButton, SecondaryButton } from "./Modal";
import { MOUNJARO_DOSES, SIDE_EFFECT_SYMPTOMS } from "@/lib/calculations";
import type { MedicationRecord } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  defaultDose?: number;
  onSave: (data: Omit<MedicationRecord, "id" | "createdAt">) => Promise<void>;
}

export default function MedicationModal({
  open, onClose, defaultDose, onSave,
}: Props) {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dose, setDose] = useState<number>(defaultDose ?? 5);
  const [appetiteScore, setAppetiteScore] = useState<number>(3);
  const [sideEffectScore, setSideEffectScore] = useState<number>(0);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDate(format(new Date(), "yyyy-MM-dd"));
      setDose(defaultDose ?? 5);
      setAppetiteScore(3);
      setSideEffectScore(0);
      setSymptoms([]);
      setNotes("");
    }
  }, [open, defaultDose]);

  const toggleSymptom = (s: string) => {
    setSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const submit = async () => {
    setSaving(true);
    try {
      await onSave({
        injectionDate: date,
        doseMg: dose,
        appetiteSuppressionScore: appetiteScore,
        sideEffectScore,
        symptoms: symptoms.length > 0 ? symptoms : undefined,
        notes: notes || undefined,
      });
      toast.success("주사 기록이 저장되었습니다");
      onClose();
    } catch {
      toast.error("저장 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="마운자로 주사 기록"
      subtitle="용량과 부작용을 기록하세요"
    >
      <div className="space-y-4">
        <div>
          <label className={labelClass}>주사일</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>용량 (mg)</label>
          <div className="grid grid-cols-6 gap-1.5">
            {MOUNJARO_DOSES.map((d) => (
              <button
                key={d}
                onClick={() => setDose(d)}
                className={`py-2.5 rounded-xl text-xs font-medium tabular transition-colors ${
                  dose === d
                    ? "bg-[var(--color-mauve-500)] text-white"
                    : "bg-black/4 dark:bg-white/5 hover:bg-black/8 dark:hover:bg-white/10"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>
            식욕 억제 정도 <span className="text-[10px] text-[color:var(--muted)]">(0=평소, 5=극단적)</span>
          </label>
          <ScoreSelector value={appetiteScore} onChange={setAppetiteScore} accent="terra" />
        </div>

        <div>
          <label className={labelClass}>
            부작용 강도 <span className="text-[10px] text-[color:var(--muted)]">(0=없음, 5=심함)</span>
          </label>
          <ScoreSelector value={sideEffectScore} onChange={setSideEffectScore} accent="wine" />
        </div>

        <div>
          <label className={labelClass}>주된 증상 (복수 선택)</label>
          <div className="flex flex-wrap gap-1.5">
            {SIDE_EFFECT_SYMPTOMS.map((s) => (
              <button
                key={s}
                onClick={() => toggleSymptom(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  symptoms.includes(s)
                    ? "bg-[var(--color-wine-500)] text-white"
                    : "bg-black/4 dark:bg-white/5"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>메모 (선택)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="주사 부위, 컨디션, 식욕 패턴 등"
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      <div className="flex gap-2 mt-6">
        <SecondaryButton onClick={onClose}>취소</SecondaryButton>
        <PrimaryButton onClick={submit} disabled={saving} color="wine">
          {saving ? "저장 중..." : "기록"}
        </PrimaryButton>
      </div>
    </Modal>
  );
}

function ScoreSelector({
  value, onChange, accent,
}: {
  value: number;
  onChange: (n: number) => void;
  accent: "terra" | "wine";
}) {
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {[0, 1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`py-2.5 rounded-xl text-sm font-medium tabular transition-colors ${
            value === n
              ? accent === "terra"
                ? "bg-[var(--color-terra-500)] text-white"
                : "bg-[var(--color-wine-500)] text-white"
              : "bg-black/4 dark:bg-white/5 hover:bg-black/8 dark:hover:bg-white/10"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
