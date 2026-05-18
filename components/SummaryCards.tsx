"use client";
import {
  calculateBMI,
  bmiCategory,
  calculateDailyTarget,
  estimateTargetDate,
} from "@/lib/calculations";
import type { UserProfile, MedicationRecord } from "@/types";
import {
  format, differenceInDays, parseISO,
  addDays, differenceInCalendarDays,
} from "date-fns";
import { ko } from "date-fns/locale";

interface Props {
  profile: UserProfile;
  currentWeight: number;
  currentWeightDate?: string; // ⭐ 현재 체중의 측정일
  currentWeightSource?: "weight" | "inbody"; // ⭐ 출처
  todayKcalIn: number;
  todayKcalBurned: number;
  medications?: MedicationRecord[];
  onAddMedication?: () => void;
}

// 상대 시간 표시
function relativeDate(dateStr?: string): string {
  if (!dateStr) return "";
  const d = parseISO(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = differenceInDays(today, target);
  if (diff === 0) return "오늘";
  if (diff === 1) return "어제";
  if (diff <= 7) return `${diff}일 전`;
  return format(d, "MM.dd", { locale: ko });
}

function formatDose(doseMg: number): string {
  return Number.isInteger(doseMg) ? `${doseMg}` : `${doseMg}`;
}

function getDoseCourseNumber(records: MedicationRecord[], target: MedicationRecord): number {
  const ordered = [...records]
    .filter((m) => m.date <= target.date)
    .sort((a, b) => a.date.localeCompare(b.date));

  let count = 0;
  let previousDose: number | null = null;
  for (const record of ordered) {
    if (record.doseMg !== previousDose) {
      count = 1;
      previousDose = record.doseMg;
    } else {
      count += 1;
    }
    if (record.id === target.id) return count;
  }
  return 1;
}

export default function SummaryCards({
  profile, currentWeight, currentWeightDate, currentWeightSource,
  todayKcalIn, todayKcalBurned, medications = [], onAddMedication,
}: Props) {
  // ⭐ Mounjaro 상태 계산
  // 일요일에 주사 기록을 남기는 사용 패턴에 맞춰, 주사일 포함 7일간 유효 기록으로 본다.
  const now = new Date();
  const validMedications = medications
    .filter((m) => {
      try {
        return differenceInCalendarDays(now, parseISO(m.date)) >= 0;
      } catch {
        return false;
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date));
  const activeShot = validMedications.find((m) => {
    const ageDays = differenceInCalendarDays(now, parseISO(m.date));
    return ageDays >= 0 && ageDays < 7;
  });
  const doseCourseNumber = activeShot
    ? getDoseCourseNumber(medications, activeShot)
    : null;
  const lastShot = validMedications.length > 0
    ? validMedications[0]
    : undefined;
  const nextDueDate = lastShot ? addDays(parseISO(lastShot.date), 7) : null;
  const dDay = nextDueDate ? differenceInCalendarDays(nextDueDate, now) : null;
  const dueLabel =
    dDay == null
      ? null
      : dDay > 0
      ? `D-${dDay}`
      : dDay === 0
      ? "오늘"
      : `${Math.abs(dDay)}일 지연`;
  const bmi = calculateBMI(currentWeight, profile.heightCm);
  const cat = bmiCategory(bmi);
  const dailyTarget = calculateDailyTarget(profile, currentWeight);
  const remaining = dailyTarget - todayKcalIn + todayKcalBurned;
  const remainingColor =
    remaining < 0
      ? "text-[var(--color-wine-600)] dark:text-[var(--color-wine-400)]"
      : remaining < 300
      ? "text-[var(--color-terra-600)] dark:text-[var(--color-terra-400)]"
      : "text-[var(--color-sage-600)] dark:text-[var(--color-sage-400)]";

  const toGoal = currentWeight - profile.targetWeightKg;
  const eta = estimateTargetDate(currentWeight, profile.targetWeightKg, 0.5);
  const progressPct = profile.startWeightKg > profile.targetWeightKg
    ? Math.min(100, Math.max(0,
        ((profile.startWeightKg - currentWeight) /
          (profile.startWeightKg - profile.targetWeightKg)) * 100))
    : 0;

  const showMedicationCard = medications.length > 0 || !!onAddMedication;

  return (
    <div className={`grid grid-cols-1 ${showMedicationCard ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3"} gap-3 mb-6`}>
      {/* 현재 체중 / BMI */}
      <Card accentColor="sage">
        <CardLabel>현재 <span className="serif-italic">체중</span> · BMI</CardLabel>
        <div className="flex items-baseline gap-2 mt-3">
          <span className="text-3xl font-semibold tabular tracking-tight">
            {currentWeight ? currentWeight.toFixed(1) : "—"}
          </span>
          <span className="text-sm text-[color:var(--muted)]">kg</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-base font-medium tabular">{bmi ? bmi.toFixed(1) : "—"}</span>
          <span className={`text-xs ${cat.color}`}>{cat.label}</span>
        </div>
        {/* ⭐ 측정일 + 출처 표시 */}
        {currentWeightDate && (
          <div className="text-[11px] text-[color:var(--muted)] mt-2 flex items-center gap-1.5">
            <span>{relativeDate(currentWeightDate)} 측정</span>
            {currentWeightSource === "inbody" && (
              <span className="inline-flex items-center text-[9px] font-semibold bg-[var(--color-mauve-500)]/15 text-[var(--color-mauve-500)] px-1.5 py-0.5 rounded">
                인바디
              </span>
            )}
          </div>
        )}
      </Card>

      {/* 목표 */}
      <Card accentColor="terra">
        <CardLabel>목표까지 <span className="serif-italic">남은 거리</span></CardLabel>
        <div className="flex items-baseline gap-2 mt-3">
          <span className="text-3xl font-semibold tabular tracking-tight">
            {toGoal > 0 ? toGoal.toFixed(1) : 0}
          </span>
          <span className="text-sm text-[color:var(--muted)]">kg</span>
        </div>
        <div className="text-xs text-[color:var(--muted)] mt-2">
          목표 {profile.targetWeightKg}kg
          {eta && (
            <>
              {" "}· 예상 도달{" "}
              <span className="text-[var(--color-terra-600)] dark:text-[var(--color-terra-400)]">
                {format(eta.date, "yy.MM.dd", { locale: ko })}
              </span>
            </>
          )}
        </div>
        <div className="progress-bar mt-3">
          <div
            className="h-full bg-[var(--color-terra-500)] transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </Card>

      {/* 잔여 칼로리 */}
      <Card accentColor={remaining < 0 ? "wine" : "sage"}>
        <CardLabel>오늘 <span className="serif-italic">잔여 칼로리</span></CardLabel>
        <div className="flex items-baseline gap-2 mt-3">
          <span className={`text-3xl font-semibold tabular tracking-tight ${remainingColor}`}>
            {remaining >= 0 ? remaining.toLocaleString() : `+${Math.abs(remaining).toLocaleString()}`}
          </span>
          <span className="text-sm text-[color:var(--muted)]">kcal</span>
        </div>
        <div className="text-xs text-[color:var(--muted)] mt-2 tabular">
          목표 {dailyTarget.toLocaleString()} · 섭취 {todayKcalIn.toLocaleString()}
          {todayKcalBurned > 0 && ` · 소모 ${todayKcalBurned.toLocaleString()}`}
        </div>
      </Card>

      {/* ⭐ 이번 주 Mounjaro */}
      {showMedicationCard && (
        <Card accentColor="mauve">
          <CardLabel>이번 주 <span className="serif-italic">Mounjaro</span></CardLabel>
          {activeShot ? (
            <>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-3xl font-semibold tabular tracking-tight text-[var(--color-mauve-500)]">
                  {formatDose(activeShot.doseMg)}
                </span>
                <span className="text-sm text-[color:var(--muted)]">mg</span>
                {doseCourseNumber != null && (
                  <span className="text-xs font-semibold text-[var(--color-mauve-500)]">
                    {doseCourseNumber}회차
                  </span>
                )}
              </div>
              <div className="text-xs text-[color:var(--muted)] mt-2 tabular">
                {format(parseISO(activeShot.date), "M.d (E)", { locale: ko })} 주사 · 이번 주 유효
              </div>
              {dDay != null && (
                <div className="text-[11px] text-[var(--color-mauve-500)] mt-1 tabular">
                  다음 예정 {format(nextDueDate!, "M.d (E)", { locale: ko })} · {dueLabel}
                </div>
              )}
              {(activeShot.appetiteSuppression != null || activeShot.nauseaLevel != null) && (
                <div className="text-[11px] text-[color:var(--muted)] mt-1 tabular">
                  식욕 {activeShot.appetiteSuppression ?? "—"}/10 · 오심 {activeShot.nauseaLevel ?? "—"}/10
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-2xl font-semibold tracking-tight text-[var(--color-terra-600)] dark:text-[var(--color-terra-400)]">
                  미기록
                </span>
              </div>
              <div className="text-xs text-[color:var(--muted)] mt-2">
                {nextDueDate
                  ? `다음 예정 ${format(nextDueDate, "M.d (E)", { locale: ko })} · ${dueLabel}`
                  : "이번 주 주사 기록을 남겨주세요"}
              </div>
              {onAddMedication && (
                <button
                  onClick={onAddMedication}
                  className="mt-3 w-full py-2 rounded-xl bg-[var(--color-mauve-500)] hover:opacity-90 text-white text-xs font-medium"
                >
                  지금 기록하기
                </button>
              )}
            </>
          )}
        </Card>
      )}
    </div>
  );
}

type AccentColor = "sage" | "terra" | "wine" | "slate-blue" | "mauve";

const ACCENT_COLOR_MAP: Record<AccentColor, string> = {
  sage: "var(--color-sage-500)",
  terra: "var(--color-terra-500)",
  wine: "var(--color-wine-500)",
  "slate-blue": "var(--color-slate-blue-500)",
  mauve: "var(--color-mauve-500)",
};

export function Card({
  children,
  accentColor,
  className = "",
}: {
  children: React.ReactNode;
  accentColor?: AccentColor;
  className?: string;
}) {
  return (
    <div
      className={`
        relative overflow-hidden
        bg-white dark:bg-[var(--color-ink-900)]
        border border-black/6 dark:border-white/6
        rounded-2xl p-5
        ${className}
      `}
      style={accentColor ? { ["--accent-color" as never]: ACCENT_COLOR_MAP[accentColor] } : undefined}
    >
      {accentColor && (
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: ACCENT_COLOR_MAP[accentColor] }}
        />
      )}
      {children}
    </div>
  );
}

export function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-medium text-[color:var(--muted-foreground)] tracking-wide">{children}</div>
  );
}
