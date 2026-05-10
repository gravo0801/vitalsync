"use client";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import Modal, { inputClass, labelClass, PrimaryButton, SecondaryButton } from "./Modal";
import { MOUNJARO_DOSES } from "@/types";
import type { MounjaroDose, InjectionSite } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  defaultDate?: string;
  defaultDose?: MounjaroDose;
  bodyWeightKg?: number;
  onSave: (params: {
    date: string;
    doseMg: MounjaroDose;
    injectionSite?: InjectionSite;
    sideEffects?: string;
    weightKgAtInjection?: number;
  }) => Promise<void>;
}

const SITES: { value: InjectionSite; label: string }[] = [
  { value: "abdomen", label: "복부" },
  { value: "thigh", label: "허벅지" },
  { value: "upper_arm", label: "상완" },
];

export default function MedicationModal({
  open, onClose, defaultDate, defaultDose, bodyWeightKg, onSave,
}: Props) {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dose, setDose] = useState<MounjaroDose>(2.5);
  const [site, setSite] = useState<InjectionSite | undefined>(undefined);
  const [sideEffects, setSideEffects] = useState("");
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDate(defaultDate || format(new Date(), "yyyy-MM-dd"));
      setDose(defaultDose ?? 2.5);
      setSite(undefined);
      setSideEffects("");
      setWeight(bodyWeightKg ? bodyWeightKg.toString() : "");
    }
  }, [open, defaultDate, defaultDose, bodyWeightKg]);

  const submit = async () => {
    setSaving(true);
    try {
      const w = weight ? parseFloat(weight) : undefined;
      if (w !== undefined && (isNaN(w) || w <= 0 || w > 300)) {
        toast.error("올바른 체중을 입력해주세요");
        setSaving(false);
        return;
      }
      await onSave({
        date,
        doseMg: dose,
        injectionSite: site,
        sideEffects: sideEffects || undefined,
        weightKgAtInjection: w,
      });
      toast.success("주사 기록이 저장되었습니다");
      onClose();
    } catch (e) {
      console.error("[MedicationModal] save failed:", e);
      toast.error("저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Mounjaro 주사 기록"
      subtitle="이번 주 주사 정보를 남겨주세요"
      zIndex={80}
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
          <div className="grid grid-cols-3 gap-1.5">
            {MOUNJARO_DOSES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDose(d)}
                className={`py-2.5 rounded-xl text-sm font-semibold tabular transition-colors ${
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
          <label className={labelClass}>주사 부위 (선택)</label>
          <div className="grid grid-cols-3 gap-1.5">
            {SITES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setSite(site === s.value ? undefined : s.value)}
                className={`py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  site === s.value
                    ? "bg-[var(--color-mauve-500)] text-white"
                    : "bg-black/4 dark:bg-white/5 hover:bg-black/8 dark:hover:bg-white/10"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>주사일 체중 (kg, 선택)</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="자동 채워짐 (수정 가능)"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>부작용 / 메모 (선택)</label>
          <textarea
            value={sideEffects}
            onChange={(e) => setSideEffects(e.target.value)}
            placeholder="오심, 피로, 식욕억제 정도 등"
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="text-[11px] text-[color:var(--muted)]">
          💡 주 1회, 같은 요일에 맞춰 주사하는 것이 권장됩니다.
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
