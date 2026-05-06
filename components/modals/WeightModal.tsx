"use client";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import Modal, { inputClass, labelClass, PrimaryButton, SecondaryButton } from "./Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  defaultDate?: string;
  onSave: (date: string, weight: number, memo?: string) => Promise<void>;
}

export default function WeightModal({ open, onClose, defaultDate, onSave }: Props) {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [weight, setWeight] = useState("");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDate(defaultDate || format(new Date(), "yyyy-MM-dd"));
      setWeight("");
      setMemo("");
    }
  }, [open, defaultDate]);

  const submit = async () => {
    if (!weight) {
      toast.error("체중을 입력해주세요");
      return;
    }
    const w = parseFloat(weight);
    if (isNaN(w) || w <= 0 || w > 300) {
      toast.error("올바른 체중을 입력해주세요");
      return;
    }
    setSaving(true);
    try {
      await onSave(date, w, memo);
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
      title="체중 기록"
      subtitle="오늘의 체중을 남겨보세요"
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
          <label className={labelClass}>체중 (kg)</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="98.0"
            className={`${inputClass} text-2xl font-semibold tabular`}
            autoFocus
          />
        </div>
        <div>
          <label className={labelClass}>메모 (선택)</label>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="아침 공복 측정 등"
            className={inputClass}
          />
        </div>
      </div>
      <div className="flex gap-2 mt-6">
        <SecondaryButton onClick={onClose}>취소</SecondaryButton>
        <PrimaryButton onClick={submit} disabled={!weight || saving} color="sage">
          {saving ? "저장 중..." : "기록"}
        </PrimaryButton>
      </div>
    </Modal>
  );
}
