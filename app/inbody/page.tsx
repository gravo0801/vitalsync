"use client";

import { useState } from "react";
import { Plus, Trash2, FileText, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { toast } from "sonner";

import { useInbody } from "@/hooks/useInbody";

import Sidebar from "@/components/Sidebar";
import { Card } from "@/components/SummaryCards";
import InbodyChart from "@/components/InbodyChart";
import InbodyAnalyzeModal from "@/components/modals/InbodyAnalyzeModal";
import type { InbodyRecord } from "@/types";

export default function InbodyPage() {
  const { records, loading, addInbody, deleteInbody } = useInbody();
  const [analyzeOpen, setAnalyzeOpen] = useState(false);

  const latest = records[records.length - 1];
  const previous = records[records.length - 2];

  const handleDelete = async (record: InbodyRecord) => {
    if (!confirm(`${record.measuredAt} 기록을 삭제하시겠어요?`)) return;
    try {
      await deleteInbody(record);
      toast.success("삭제되었습니다");
    } catch {
      toast.error("삭제 실패");
    }
  };

  const diff = (key: keyof InbodyRecord): { value: number; positive: boolean } | null => {
    if (!latest || !previous) return null;
    const a = latest[key];
    const b = previous[key];
    if (typeof a !== "number" || typeof b !== "number") return null;
    const d = a - b;
    return { value: Math.abs(d), positive: d >= 0 };
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto">
          {/* 헤더 */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pl-12 lg:pl-0">
            <div>
              <p className="text-sm text-[color:var(--muted)]">건강 측정</p>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-1">
                인바디 <span className="serif-italic text-[color:var(--color-terra-600)]">결과 관리</span>
              </h1>
            </div>
            <button
              onClick={() => setAnalyzeOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium bg-[var(--color-ink-900)] dark:bg-white/15 text-white hover:opacity-90"
            >
              <Plus size={14} /> 결과 추가
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-sm text-[color:var(--muted)]">불러오는 중...</div>
          ) : records.length === 0 ? (
            <Card className="text-center py-16">
              <p className="text-base font-medium mb-2">
                아직 <span className="serif-italic">인바디 결과</span>가 없습니다
              </p>
              <p className="text-sm text-[color:var(--muted)] mb-5">
                결과지 사진이나 PDF를 업로드하면<br />
                AI가 자동으로 수치를 추출합니다
              </p>
              <button
                onClick={() => setAnalyzeOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-[var(--color-sage-500)] hover:bg-[var(--color-sage-600)] text-white"
              >
                <Plus size={14} /> 첫 기록 추가하기
              </button>
            </Card>
          ) : (
            <>
              {/* 최신 측정값 요약 */}
              {latest && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                  <SummaryStat
                    label="체중"
                    value={latest.weight}
                    unit="kg"
                    accent="sage"
                    diff={diff("weight")}
                    diffInverse
                  />
                  <SummaryStat
                    label="골격근량"
                    value={latest.skeletalMuscleMass}
                    unit="kg"
                    accent="slate-blue"
                    diff={diff("skeletalMuscleMass")}
                  />
                  <SummaryStat
                    label="체지방량"
                    value={latest.bodyFatMass}
                    unit="kg"
                    accent="wine"
                    diff={diff("bodyFatMass")}
                    diffInverse
                  />
                  <SummaryStat
                    label="체지방률"
                    value={latest.bodyFatPercent}
                    unit="%"
                    accent="terra"
                    diff={diff("bodyFatPercent")}
                    diffInverse
                  />
                </div>
              )}

              {/* 그래프 */}
              <InbodyChart records={records} />

              {/* 측정 기록 목록 */}
              <Card>
                <h3 className="text-base font-semibold tracking-tight mb-4">
                  측정 <span className="serif-italic">기록</span>
                  <span className="ml-2 text-xs font-normal text-[color:var(--muted)]">
                    {records.length}건
                  </span>
                </h3>

                <div className="space-y-2">
                  {[...records].reverse().map((r) => (
                    <RecordCard key={r.id} record={r} onDelete={() => handleDelete(r)} />
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>
      </main>

      <InbodyAnalyzeModal
        open={analyzeOpen}
        onClose={() => setAnalyzeOpen(false)}
        onSave={addInbody}
      />
    </div>
  );
}

function SummaryStat({
  label, value, unit, accent, diff, diffInverse,
}: {
  label: string;
  value?: number;
  unit: string;
  accent: "sage" | "slate-blue" | "wine" | "terra";
  diff: { value: number; positive: boolean } | null;
  diffInverse?: boolean; // 양수가 나쁜 의미인 경우 (체중↑은 빨강)
}) {
  const accentColor = `var(--color-${accent}-500)`;
  return (
    <div
      className="relative bg-white dark:bg-[var(--color-ink-900)] border border-black/6 dark:border-white/6 rounded-2xl p-4 overflow-hidden"
    >
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: accentColor }}
      />
      <div className="text-[11px] font-medium text-[color:var(--muted-foreground)] tracking-wide">
        {label}
      </div>
      <div className="flex items-baseline gap-1.5 mt-2">
        <span className="text-2xl font-semibold tabular tracking-tight">
          {value != null ? value.toFixed(1) : "—"}
        </span>
        <span className="text-xs text-[color:var(--muted)]">{unit}</span>
      </div>
      {diff && (
        <div className="text-[11px] mt-1.5 tabular">
          <span
            className={
              diffInverse
                ? diff.positive
                  ? "text-[var(--color-wine-600)]"
                  : "text-[var(--color-sage-600)]"
                : diff.positive
                ? "text-[var(--color-sage-600)]"
                : "text-[var(--color-wine-600)]"
            }
          >
            {diff.positive ? "▲" : "▼"} {diff.value.toFixed(1)}{unit}
          </span>
          <span className="text-[color:var(--muted)] ml-1">vs 이전</span>
        </div>
      )}
    </div>
  );
}

function RecordCard({
  record, onDelete,
}: {
  record: InbodyRecord;
  onDelete: () => void;
}) {
  const isPDF = record.fileURL?.includes(".pdf") || record.fileURL?.toLowerCase().includes("pdf");

  return (
    <div className="rounded-xl border border-black/6 dark:border-white/6 p-4 group hover:bg-black/2 dark:hover:bg-white/3 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold tabular">
              {format(new Date(record.measuredAt), "yyyy.MM.dd (E)", { locale: ko })}
            </span>
            {record.fileURL && (
              <a
                href={record.fileURL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-[10px] text-[color:var(--muted)] hover:text-[var(--color-sage-600)]"
              >
                {isPDF ? <FileText size={11} /> : <ImageIcon size={11} />}
                원본
              </a>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5 text-xs">
            <Stat label="체중" value={record.weight} unit="kg" />
            <Stat label="골격근" value={record.skeletalMuscleMass} unit="kg" />
            <Stat label="체지방" value={record.bodyFatMass} unit="kg" />
            <Stat label="체지방률" value={record.bodyFatPercent} unit="%" />
            <Stat label="BMI" value={record.bmi} />
            <Stat label="BMR" value={record.bmr} unit="kcal" />
            <Stat label="내장지방" value={record.visceralFatLevel} />
            <Stat label="점수" value={record.inbodyScore} />
          </div>

          {record.notes && (
            <p className="text-xs text-[color:var(--muted-foreground)] mt-2 italic">
              {record.notes}
            </p>
          )}
        </div>

        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-[var(--color-wine-500)]/10 shrink-0"
          aria-label="삭제"
        >
          <Trash2 size={13} className="text-[var(--color-wine-500)]" />
        </button>
      </div>
    </div>
  );
}

function Stat({
  label, value, unit,
}: {
  label: string;
  value?: number;
  unit?: string;
}) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-[color:var(--muted)] w-12 shrink-0">{label}</span>
      <span className="font-medium tabular">
        {value != null ? value.toFixed(1) : "—"}
        {unit && value != null && (
          <span className="text-[color:var(--muted)] font-normal ml-0.5">{unit}</span>
        )}
      </span>
    </div>
  );
}
