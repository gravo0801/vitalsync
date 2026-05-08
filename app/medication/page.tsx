"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Calendar as CalIcon, Syringe, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { toast } from "sonner";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

import { useMedication } from "@/hooks/useMedication";
import { useProfile } from "@/hooks/useProfile";

import Sidebar from "@/components/Sidebar";
import { Card } from "@/components/SummaryCards";
import MedicationModal from "@/components/modals/MedicationModal";
import {
  nextInjectionDate,
  daysBetween,
  weeksSinceMedicationStart,
} from "@/lib/calculations";
import type { MedicationRecord } from "@/types";

export default function MedicationPage() {
  const { records, loading, addMedication, deleteMedication } = useMedication();
  const { profile, saveProfile } = useProfile();
  const [open, setOpen] = useState(false);

  const latest = records[records.length - 1];
  const next = nextInjectionDate(records);
  const dDay = next ? daysBetween(next) : null;
  const weeksOnMed = profile?.medication?.startDate
    ? weeksSinceMedicationStart(profile.medication.startDate)
    : 0;

  const handleDelete = async (rec: MedicationRecord) => {
    if (!confirm(`${rec.injectionDate} 기록을 삭제하시겠어요?`)) return;
    try {
      await deleteMedication(rec.id);
      toast.success("삭제되었습니다");
    } catch {
      toast.error("삭제 실패");
    }
  };

  // 첫 주사 기록 시 프로필에 마운자로 정보 자동 등록
  const handleAddMedication = async (
    data: Omit<MedicationRecord, "id" | "createdAt">
  ) => {
    await addMedication(data);
    if (profile && !profile.medication) {
      await saveProfile({
        ...profile,
        medication: {
          type: "mounjaro",
          startDate: data.injectionDate,
          currentDoseMg: data.doseMg,
        },
      });
    } else if (profile && profile.medication) {
      // 최신 용량으로 업데이트
      await saveProfile({
        ...profile,
        medication: {
          ...profile.medication,
          currentDoseMg: data.doseMg,
        },
      });
    }
  };

  // 차트 데이터 (용량 변화)
  const doseChartData = records.map((r) => ({
    date: format(new Date(r.injectionDate), "MM.dd"),
    용량: r.doseMg,
    부작용: r.sideEffectScore ?? 0,
    식욕억제: r.appetiteSuppressionScore ?? 0,
  }));

  // 부작용 빈도 (최근 5회 평균)
  const recentRecords = records.slice(-5);
  const avgSideEffect =
    recentRecords.length > 0
      ? recentRecords.reduce((s, r) => s + (r.sideEffectScore ?? 0), 0) /
        recentRecords.length
      : 0;
  const avgAppetite =
    recentRecords.length > 0
      ? recentRecords.reduce((s, r) => s + (r.appetiteSuppressionScore ?? 0), 0) /
        recentRecords.length
      : 0;

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto">
          {/* 헤더 */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pl-12 lg:pl-0">
            <div className="flex items-start gap-3">
              <Link
                href="/"
                className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 mt-1.5"
              >
                <ArrowLeft size={18} />
              </Link>
              <div>
                <p className="text-sm text-[color:var(--muted)]">약물 관리</p>
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-1">
                  마운자로 <span className="serif-italic text-[var(--color-mauve-500)]">트래커</span>
                </h1>
              </div>
            </div>
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium bg-[var(--color-ink-900)] dark:bg-white/15 text-white hover:opacity-90"
            >
              <Plus size={14} /> 주사 기록
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-sm text-[color:var(--muted)]">불러오는 중...</div>
          ) : records.length === 0 ? (
            <Card className="text-center py-16">
              <Syringe className="mx-auto mb-3 text-[var(--color-mauve-500)]" size={32} />
              <p className="text-base font-medium mb-2">
                아직 <span className="serif-italic">주사 기록</span>이 없습니다
              </p>
              <p className="text-sm text-[color:var(--muted)] mb-5">
                매주 주사 후 용량과 부작용을 기록하면<br />
                약물 효과 패턴을 자동으로 분석합니다
              </p>
              <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-[var(--color-mauve-500)] hover:opacity-90 text-white"
              >
                <Plus size={14} /> 첫 주사 기록하기
              </button>
            </Card>
          ) : (
            <>
              {/* 다음 주사 D-day */}
              {next && (
                <Card accentColor="mauve" className="mb-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-[color:var(--muted-foreground)] tracking-wide mb-2">
                        다음 <span className="serif-italic">주사</span>
                      </div>
                      <div className="text-3xl sm:text-4xl font-semibold tabular tracking-tight">
                        {dDay === 0 ? (
                          <span className="text-[var(--color-mauve-500)]">D-DAY</span>
                        ) : dDay! < 0 ? (
                          <span className="text-[var(--color-wine-500)]">{Math.abs(dDay!)}일 지남</span>
                        ) : (
                          <>D-{dDay}</>
                        )}
                      </div>
                      <p className="text-sm text-[color:var(--muted)] mt-1.5">
                        {format(next, "yyyy년 MM월 dd일 (E)", { locale: ko })}
                      </p>
                    </div>
                    <CalIcon size={32} className="text-[var(--color-mauve-500)] opacity-50" />
                  </div>
                </Card>
              )}

              {/* 핵심 통계 4카드 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <StatCard
                  label="현재 용량"
                  value={latest.doseMg}
                  unit="mg"
                  accent="mauve"
                />
                <StatCard
                  label="복용 주차"
                  value={weeksOnMed}
                  unit="주차"
                  accent="slate-blue"
                />
                <StatCard
                  label="총 주사 횟수"
                  value={records.length}
                  unit="회"
                  accent="sage"
                />
                <StatCard
                  label="최근 5회 부작용"
                  value={avgSideEffect.toFixed(1)}
                  unit="/5"
                  accent="wine"
                  hint={
                    avgSideEffect < 1.5 ? "양호" :
                    avgSideEffect < 3 ? "보통" : "주의"
                  }
                />
              </div>

              {/* 용량/부작용 그래프 */}
              {records.length >= 2 && (
                <Card className="mb-5">
                  <h3 className="text-base font-semibold tracking-tight mb-4">
                    용량 & 부작용 <span className="serif-italic">추이</span>
                  </h3>
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={doseChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="2 4" stroke="currentColor" strokeOpacity={0.08} />
                        <XAxis dataKey="date" stroke="currentColor" strokeOpacity={0.4} fontSize={11}
                          tick={{ fill: "currentColor", opacity: 0.6 }} />
                        <YAxis yAxisId="dose" stroke="currentColor" strokeOpacity={0.4} fontSize={11}
                          tick={{ fill: "currentColor", opacity: 0.6 }} />
                        <YAxis yAxisId="score" orientation="right" domain={[0, 5]}
                          stroke="currentColor" strokeOpacity={0.4} fontSize={11}
                          tick={{ fill: "currentColor", opacity: 0.6 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--card)",
                            border: "1px solid var(--card-border)",
                            borderRadius: "10px", color: "var(--foreground)", fontSize: "12px",
                          }}
                        />
                        <Line yAxisId="dose" type="monotone" dataKey="용량"
                          stroke="var(--color-mauve-500)" strokeWidth={2}
                          dot={{ fill: "var(--color-mauve-500)", r: 3, strokeWidth: 0 }} />
                        <Line yAxisId="score" type="monotone" dataKey="부작용"
                          stroke="var(--color-wine-500)" strokeWidth={1.5} strokeDasharray="3 3"
                          dot={{ fill: "var(--color-wine-500)", r: 2, strokeWidth: 0 }} />
                        <Line yAxisId="score" type="monotone" dataKey="식욕억제"
                          stroke="var(--color-terra-500)" strokeWidth={1.5} strokeDasharray="3 3"
                          dot={{ fill: "var(--color-terra-500)", r: 2, strokeWidth: 0 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-3 text-xs text-[color:var(--muted)]">
                    <Legend color="var(--color-mauve-500)" label="용량 (mg, 좌축)" />
                    <Legend color="var(--color-wine-500)" label="부작용 강도 (우축)" />
                    <Legend color="var(--color-terra-500)" label="식욕 억제 (우축)" />
                  </div>
                </Card>
              )}

              {/* 주사 기록 목록 */}
              <Card>
                <h3 className="text-base font-semibold tracking-tight mb-4">
                  주사 <span className="serif-italic">기록</span>
                  <span className="ml-2 text-xs font-normal text-[color:var(--muted)]">
                    {records.length}회
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

      <MedicationModal
        open={open}
        onClose={() => setOpen(false)}
        defaultDose={latest?.doseMg}
        onSave={handleAddMedication}
      />
    </div>
  );
}

function StatCard({
  label, value, unit, accent, hint,
}: {
  label: string;
  value: number | string;
  unit: string;
  accent: "mauve" | "sage" | "slate-blue" | "wine";
  hint?: string;
}) {
  const accentColor = `var(--color-${accent}-500)`;
  return (
    <div className="relative bg-white dark:bg-[var(--color-ink-900)] border border-black/6 dark:border-white/6 rounded-2xl p-4 overflow-hidden">
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: accentColor }}
      />
      <div className="text-[11px] font-medium text-[color:var(--muted-foreground)] tracking-wide">
        {label}
      </div>
      <div className="flex items-baseline gap-1.5 mt-2">
        <span className="text-2xl font-semibold tabular tracking-tight">{value}</span>
        <span className="text-xs text-[color:var(--muted)]">{unit}</span>
      </div>
      {hint && (
        <div className="text-[11px] mt-1.5" style={{ color: accentColor }}>
          {hint}
        </div>
      )}
    </div>
  );
}

function RecordCard({
  record, onDelete,
}: {
  record: MedicationRecord;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-xl border border-black/6 dark:border-white/6 p-4 group hover:bg-black/2 dark:hover:bg-white/3 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold tabular">
              {format(new Date(record.injectionDate), "yyyy.MM.dd (E)", { locale: ko })}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--color-mauve-500)]/15 text-[var(--color-mauve-500)] tabular">
              {record.doseMg} mg
            </span>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {record.appetiteSuppressionScore != null && (
              <Stat label="식욕억제" value={`${record.appetiteSuppressionScore}/5`} color="var(--color-terra-600)" />
            )}
            {record.sideEffectScore != null && (
              <Stat label="부작용" value={`${record.sideEffectScore}/5`} color="var(--color-wine-600)" />
            )}
          </div>

          {record.symptoms && record.symptoms.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {record.symptoms.map((s) => (
                <span
                  key={s}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-wine-500)]/10 text-[var(--color-wine-600)] dark:text-[var(--color-wine-400)]"
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          {record.notes && (
            <p className="text-xs text-[color:var(--muted-foreground)] mt-2 italic">
              {record.notes}
            </p>
          )}
        </div>

        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-[var(--color-wine-500)]/10 shrink-0"
        >
          <Trash2 size={13} className="text-[var(--color-wine-500)]" />
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-[color:var(--muted)]">{label}</span>
      <span className="font-medium tabular" style={{ color }}>{value}</span>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-3 h-0.5" style={{ background: color }} />
      <span>{label}</span>
    </div>
  );
}
