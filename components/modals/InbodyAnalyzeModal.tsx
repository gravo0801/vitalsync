"use client";
import { useState, useEffect } from "react";
import { Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import Modal, { inputClass, labelClass, PrimaryButton, SecondaryButton } from "./Modal";
import type { InbodyRecord } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (
    data: Omit<InbodyRecord, "id" | "createdAt" | "fileURL">,
    file?: File | null
  ) => Promise<void>;
}

type FormState = {
  measuredAt: string;
  weight: string;
  skeletalMuscleMass: string;
  bodyFatMass: string;
  bodyFatPercent: string;
  bmi: string;
  bmr: string;
  visceralFatLevel: string;
  totalBodyWater: string;
  protein: string;
  minerals: string;
  inbodyScore: string;
  notes: string;
};

const EMPTY: FormState = {
  measuredAt: format(new Date(), "yyyy-MM-dd"),
  weight: "", skeletalMuscleMass: "", bodyFatMass: "",
  bodyFatPercent: "", bmi: "", bmr: "", visceralFatLevel: "",
  totalBodyWater: "", protein: "", minerals: "", inbodyScore: "",
  notes: "",
};

export default function InbodyAnalyzeModal({ open, onClose, onSave }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);

  useEffect(() => {
    if (open) {
      setFile(null);
      setAnalyzing(false);
      setSaving(false);
      setAnalyzed(false);
      setForm(EMPTY);
    }
  }, [open]);

  const analyze = async () => {
    if (!file) {
      toast.error("파일을 먼저 선택해주세요");
      return;
    }
    setAnalyzing(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/analyze-inbody", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "분석 실패");
      }
      const d = json.data;
      setForm({
        measuredAt: d.measuredAt || format(new Date(), "yyyy-MM-dd"),
        weight: numStr(d.weight),
        skeletalMuscleMass: numStr(d.skeletalMuscleMass),
        bodyFatMass: numStr(d.bodyFatMass),
        bodyFatPercent: numStr(d.bodyFatPercent),
        bmi: numStr(d.bmi),
        bmr: numStr(d.bmr),
        visceralFatLevel: numStr(d.visceralFatLevel),
        totalBodyWater: numStr(d.totalBodyWater),
        protein: numStr(d.protein),
        minerals: numStr(d.minerals),
        inbodyScore: numStr(d.inbodyScore),
        notes: "",
      });
      setAnalyzed(true);
      toast.success("AI 분석 완료! 값을 검토하고 저장해주세요");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "분석 실패";
      toast.error(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const submit = async () => {
    if (!form.measuredAt) {
      toast.error("측정일을 입력해주세요");
      return;
    }
    setSaving(true);
    try {
      await onSave(
        {
          measuredAt: form.measuredAt,
          weight: parseNum(form.weight),
          skeletalMuscleMass: parseNum(form.skeletalMuscleMass),
          bodyFatMass: parseNum(form.bodyFatMass),
          bodyFatPercent: parseNum(form.bodyFatPercent),
          bmi: parseNum(form.bmi),
          bmr: parseNum(form.bmr),
          visceralFatLevel: parseNum(form.visceralFatLevel),
          totalBodyWater: parseNum(form.totalBodyWater),
          protein: parseNum(form.protein),
          minerals: parseNum(form.minerals),
          inbodyScore: parseNum(form.inbodyScore),
          notes: form.notes || "",
        },
        file
      );
      toast.success("저장되었습니다");
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
      title="인바디 결과 추가"
      subtitle={analyzed ? "AI가 추출한 값을 검토하고 저장하세요" : "사진 또는 PDF를 업로드하면 AI가 자동 분석합니다"}
    >
      {/* 1단계: 파일 업로드 + 분석 */}
      <div className="space-y-4">
        <div>
          <label className={labelClass}>인바디 결과지 (사진 또는 PDF)</label>
          <div className="rounded-xl border-2 border-dashed border-black/10 dark:border-white/10 px-4 py-5 text-center hover:border-[var(--color-sage-500)]/50 transition-colors">
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setAnalyzed(false);
              }}
              className="block w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-black/5 dark:file:bg-white/8 file:text-[color:var(--foreground)] hover:file:bg-black/8"
            />
            {file && (
              <div className="mt-2 text-xs text-[color:var(--muted-foreground)]">
                <Upload size={11} className="inline mr-1" />
                {file.name} <span className="text-[color:var(--muted)]">({Math.round(file.size / 1024)} KB)</span>
              </div>
            )}
          </div>
        </div>

        {file && !analyzed && (
          <button
            onClick={analyze}
            disabled={analyzing}
            className="w-full py-3 rounded-xl bg-[var(--color-sage-500)] hover:bg-[var(--color-sage-600)] text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Sparkles size={14} />
            {analyzing ? "AI 분석 중... (15~30초)" : "AI로 자동 분석하기"}
          </button>
        )}
      </div>

      {/* 2단계: 분석 결과 검토 폼 */}
      {analyzed && (
        <>
          <div className="border-t border-black/5 dark:border-white/5 my-5 pt-5" />
          <div className="space-y-3">
            <div>
              <label className={labelClass}>측정일</label>
              <input
                type="date"
                value={form.measuredAt}
                onChange={(e) => setForm({ ...form, measuredAt: e.target.value })}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <NumField label="체중 (kg)" value={form.weight} onChange={(v) => setForm({ ...form, weight: v })} />
              <NumField label="BMI" value={form.bmi} onChange={(v) => setForm({ ...form, bmi: v })} />
              <NumField label="골격근량 (kg)" value={form.skeletalMuscleMass} onChange={(v) => setForm({ ...form, skeletalMuscleMass: v })} />
              <NumField label="체지방량 (kg)" value={form.bodyFatMass} onChange={(v) => setForm({ ...form, bodyFatMass: v })} />
              <NumField label="체지방률 (%)" value={form.bodyFatPercent} onChange={(v) => setForm({ ...form, bodyFatPercent: v })} />
              <NumField label="BMR (kcal)" value={form.bmr} onChange={(v) => setForm({ ...form, bmr: v })} />
              <NumField label="내장지방 레벨" value={form.visceralFatLevel} onChange={(v) => setForm({ ...form, visceralFatLevel: v })} />
              <NumField label="체수분 (kg)" value={form.totalBodyWater} onChange={(v) => setForm({ ...form, totalBodyWater: v })} />
              <NumField label="단백질 (kg)" value={form.protein} onChange={(v) => setForm({ ...form, protein: v })} />
              <NumField label="무기질 (kg)" value={form.minerals} onChange={(v) => setForm({ ...form, minerals: v })} />
              <NumField label="인바디 점수" value={form.inbodyScore} onChange={(v) => setForm({ ...form, inbodyScore: v })} />
            </div>

            <div>
              <label className={labelClass}>메모 (선택)</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="컨디션, 측정 환경 등"
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>
        </>
      )}

      <div className="flex gap-2 mt-6">
        <SecondaryButton onClick={onClose}>취소</SecondaryButton>
        {analyzed && (
          <PrimaryButton onClick={submit} disabled={saving} color="sage">
            {saving ? "저장 중..." : "저장"}
          </PrimaryButton>
        )}
      </div>
    </Modal>
  );
}

function NumField({
  label, value, onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-[10px] font-medium text-[color:var(--muted-foreground)] mb-1 block">
        {label}
      </label>
      <input
        type="number"
        inputMode="decimal"
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} py-2 text-sm tabular`}
      />
    </div>
  );
}

function numStr(v: number | null | undefined): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

function parseNum(s: string): number | undefined {
  if (!s) return undefined;
  const n = parseFloat(s);
  return isNaN(n) ? undefined : n;
}
