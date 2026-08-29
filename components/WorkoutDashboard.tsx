"use client";

import { useMemo } from "react";
import {
  eachDayOfInterval,
  eachWeekOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subWeeks,
} from "date-fns";
import { ko } from "date-fns/locale";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  Clock3,
  Download,
  Dumbbell,
  Flame,
  Plus,
  User,
} from "lucide-react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { WorkoutWithPtNumber } from "@/types";
import {
  calculateWorkoutVolume,
  summarizeCardio,
  summarizeSets,
  totalWorkoutSets,
} from "@/lib/workoutCalculations";
import { buildWorkoutCsv } from "@/lib/workoutCsv";
import { Card } from "./SummaryCards";

interface Props {
  workouts: WorkoutWithPtNumber[];
  onAddWorkout: () => void;
  onSelectDate: (date: string) => void;
}

interface WeeklyWorkoutPoint {
  label: string;
  personal: number;
  pt: number;
  sessions: number;
}

const ACTIVITY_CLASSES = [
  "bg-black/[0.04] dark:bg-white/[0.05] text-[color:var(--muted)]",
  "bg-[var(--color-slate-blue-500)]/20 text-[var(--color-slate-blue-600)] dark:text-[var(--color-slate-blue-400)]",
  "bg-[var(--color-slate-blue-500)]/40 text-[var(--color-slate-blue-600)] dark:text-white/80",
  "bg-[var(--color-slate-blue-500)]/65 text-white",
  "bg-[var(--color-slate-blue-500)] text-white",
] as const;

function safeDate(date: string): Date | null {
  try {
    const parsed = parseISO(date);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

function totalMinutes(records: WorkoutWithPtNumber[]): number {
  return records.reduce((sum, workout) => sum + (Number(workout.duration) || 0), 0);
}

function activityLevel(minutes: number): number {
  if (minutes <= 0) return 0;
  if (minutes < 30) return 1;
  if (minutes < 60) return 2;
  if (minutes < 90) return 3;
  return 4;
}

export default function WorkoutDashboard({ workouts, onAddWorkout, onSelectDate }: Props) {
  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const thisWeek = {
      start: startOfWeek(today, { weekStartsOn: 1 }),
      end: endOfWeek(today, { weekStartsOn: 1 }),
    };
    const previousWeek = {
      start: subWeeks(thisWeek.start, 1),
      end: subDays(thisWeek.start, 1),
    };
    const thisMonth = { start: startOfMonth(today), end: endOfMonth(today) };

    const validWorkouts = workouts
      .map((workout) => ({ workout, parsedDate: safeDate(workout.date) }))
      .filter((entry): entry is { workout: WorkoutWithPtNumber; parsedDate: Date } => !!entry.parsedDate);

    const currentWeekRecords = validWorkouts
      .filter(({ parsedDate }) => isWithinInterval(parsedDate, thisWeek))
      .map(({ workout }) => workout);
    const previousWeekRecords = validWorkouts
      .filter(({ parsedDate }) => isWithinInterval(parsedDate, previousWeek))
      .map(({ workout }) => workout);
    const monthRecords = validWorkouts
      .filter(({ parsedDate }) => isWithinInterval(parsedDate, thisMonth))
      .map(({ workout }) => workout);

    const weeks = eachWeekOfInterval(
      { start: subWeeks(thisWeek.start, 7), end: thisWeek.end },
      { weekStartsOn: 1 },
    );

    const weeklyData: WeeklyWorkoutPoint[] = weeks.map((weekStart) => {
      const interval = {
        start: weekStart,
        end: endOfWeek(weekStart, { weekStartsOn: 1 }),
      };
      const weekRecords = validWorkouts
        .filter(({ parsedDate }) => isWithinInterval(parsedDate, interval))
        .map(({ workout }) => workout);

      return {
        label: format(weekStart, "M.d"),
        personal: totalMinutes(weekRecords.filter((workout) => workout.category !== "PT")),
        pt: totalMinutes(weekRecords.filter((workout) => workout.category === "PT")),
        sessions: weekRecords.length,
      };
    });

    const activityDays = eachDayOfInterval({
      start: subDays(today, 27),
      end: today,
    }).map((date) => {
      const dateKey = format(date, "yyyy-MM-dd");
      const dayRecords = workouts.filter((workout) => workout.date === dateKey);
      return {
        date,
        dateKey,
        minutes: totalMinutes(dayRecords),
        sessions: dayRecords.length,
      };
    });

    const recent = [...workouts]
      .filter((workout) => safeDate(workout.date))
      .sort((a, b) => {
        const dateOrder = b.date.localeCompare(a.date);
        if (dateOrder !== 0) return dateOrder;
        return (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0);
      })
      .slice(0, 4);

    return {
      currentWeekRecords,
      previousWeekRecords,
      monthRecords,
      weeklyData,
      activityDays,
      recent,
    };
  }, [workouts]);

  const weekMinutes = totalMinutes(stats.currentWeekRecords);
  const monthMinutes = totalMinutes(stats.monthRecords);
  const monthExercises = stats.monthRecords.flatMap((workout) => workout.exercises ?? []);
  const monthVolume = calculateWorkoutVolume(monthExercises);
  const monthStrengthSets = totalWorkoutSets(monthExercises);
  const weekSessionDelta = stats.currentWeekRecords.length - stats.previousWeekRecords.length;
  const monthCalories = stats.monthRecords.reduce(
    (sum, workout) => sum + (Number(workout.caloriesBurned) || 0),
    0,
  );

  const handleShareCsv = async () => {
    if (workouts.length === 0) {
      toast.error("공유할 운동 기록이 없습니다");
      return;
    }

    const csv = buildWorkoutCsv(workouts);
    const dateStamp = format(new Date(), "yyyy-MM-dd");
    const fileName = `vitalsync-workouts-${dateStamp}.csv`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const file = new File([blob], fileName, { type: blob.type });

    try {
      if (typeof navigator.share === "function" &&
          (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({
          title: "VitalSync 운동 기록",
          text: "VitalSync 전체 운동 기록 CSV 파일",
          files: [file],
        });
        toast.success("운동 기록을 공유했습니다");
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    toast.success("CSV 파일을 다운로드했습니다");
  };

  return (
    <Card accentColor="slate-blue" className="mb-6 p-0">
      <section aria-labelledby="workout-dashboard-title">
        <div className="flex flex-col gap-4 border-b border-black/6 px-5 py-5 dark:border-white/6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-slate-blue-600)] dark:text-[var(--color-slate-blue-400)]">
              <Activity size={13} aria-hidden="true" /> Workout overview
            </div>
            <h2 id="workout-dashboard-title" className="text-lg font-semibold tracking-tight sm:text-xl">
              운동 <span className="serif-italic">리듬과 기록</span>
            </h2>
            <p className="mt-1 text-xs text-[color:var(--muted)]">
              자동 입력된 운동을 주간 추이와 최근 상세 기록으로 한눈에 확인합니다.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleShareCsv}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--color-slate-blue-500)]/25 bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-slate-blue-600)] transition-colors hover:bg-[var(--color-slate-blue-500)]/[0.06] dark:bg-transparent dark:text-[var(--color-slate-blue-400)]"
              aria-label="전체 운동 기록을 CSV 파일로 공유"
            >
              <Download size={15} aria-hidden="true" /> CSV 공유
            </button>
            <button
              type="button"
              onClick={onAddWorkout}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[var(--color-slate-blue-500)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <Plus size={15} aria-hidden="true" /> 운동 기록
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px bg-black/6 dark:bg-white/6 lg:grid-cols-4">
          <Metric
            icon={<Dumbbell size={15} />}
            label="이번 주 운동"
            value={`${stats.currentWeekRecords.length}`}
            unit="회"
            helper={
              weekSessionDelta === 0
                ? "지난주와 같아요"
                : `지난주보다 ${weekSessionDelta > 0 ? "+" : ""}${weekSessionDelta}회`
            }
          />
          <Metric
            icon={<Clock3 size={15} />}
            label="이번 주 시간"
            value={`${weekMinutes}`}
            unit="분"
            helper={weekMinutes >= 60 ? `${Math.floor(weekMinutes / 60)}시간 ${weekMinutes % 60}분` : "누적 운동 시간"}
          />
          <Metric
            icon={<CalendarDays size={15} />}
            label="이번 달 근력볼륨"
            value={Math.round(monthVolume).toLocaleString()}
            unit="kg"
            helper={monthStrengthSets > 0 ? `${monthStrengthSets}세트 누적` : `${stats.monthRecords.length}회 · ${monthMinutes}분`}
          />
          <Metric
            icon={<Flame size={15} />}
            label="이번 달 소모"
            value={monthCalories.toLocaleString()}
            unit="kcal"
            helper="기록된 칼로리 합계"
          />
        </div>

        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <div className="border-b border-black/6 p-5 dark:border-white/6 sm:p-6 lg:border-b-0 lg:border-r">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">최근 8주 운동 시간</h3>
                <p className="mt-0.5 text-[11px] text-[color:var(--muted)]">개인 운동과 PT를 분리해 표시합니다.</p>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-[color:var(--muted-foreground)]">
                <Legend color="var(--color-slate-blue-500)" label="개인" />
                <Legend color="var(--color-wine-500)" label="PT" />
              </div>
            </div>
            <div className="h-52 w-full" role="img" aria-label="최근 8주 개인 운동과 PT 시간 막대그래프">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weeklyData} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--card-border)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted)", fontSize: 10 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={38}
                    tick={{ fill: "var(--muted)", fontSize: 10 }}
                    unit="분"
                  />
                  <Tooltip content={<WorkoutTooltip />} cursor={{ fill: "var(--card-border)" }} />
                  <Bar dataKey="personal" stackId="minutes" fill="var(--color-slate-blue-500)" radius={[0, 0, 4, 4]} maxBarSize={30} />
                  <Bar dataKey="pt" stackId="minutes" fill="var(--color-wine-500)" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-5 border-t border-black/6 pt-4 dark:border-white/6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-semibold">최근 28일 운동 리듬</h3>
                <span className="text-[10px] text-[color:var(--muted)]">진할수록 운동 시간이 길어요</span>
              </div>
              <div className="grid grid-cols-7 gap-1.5" aria-label="최근 28일 운동 활동표">
                {stats.activityDays.map((day) => {
                  const level = activityLevel(day.minutes);
                  return (
                    <button
                      type="button"
                      key={day.dateKey}
                      onClick={() => onSelectDate(day.dateKey)}
                      title={`${format(day.date, "M월 d일", { locale: ko })}: ${day.sessions}회, ${day.minutes}분`}
                      aria-label={`${format(day.date, "M월 d일", { locale: ko })} 운동 ${day.sessions}회 ${day.minutes}분`}
                      className={`aspect-square min-h-8 rounded-lg text-[9px] tabular transition-transform hover:-translate-y-0.5 sm:min-h-9 ${ACTIVITY_CLASSES[level]}`}
                    >
                      {format(day.date, "d")}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">최근 운동 상세</h3>
                <p className="mt-0.5 text-[11px] text-[color:var(--muted)]">GPT 자동 기록도 여기에 바로 나타납니다.</p>
              </div>
              <span className="rounded-full bg-[var(--color-slate-blue-500)]/10 px-2.5 py-1 text-[10px] font-semibold text-[var(--color-slate-blue-600)] dark:text-[var(--color-slate-blue-400)]">
                최근 {stats.recent.length}건
              </span>
            </div>

            {stats.recent.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-black/10 px-5 text-center dark:border-white/10">
                <Dumbbell size={24} className="mb-3 text-[color:var(--muted)]" aria-hidden="true" />
                <p className="text-sm font-medium">아직 운동 기록이 없습니다.</p>
                <p className="mt-1 text-xs text-[color:var(--muted)]">첫 기록을 추가하면 추이가 자동으로 만들어집니다.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.recent.map((workout, index) => (
                  <RecentWorkout
                    key={workout.id}
                    workout={workout}
                    featured={index === 0}
                    onOpen={() => onSelectDate(workout.date)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </Card>
  );
}

function Metric({
  icon,
  label,
  value,
  unit,
  helper,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  helper: string;
}) {
  return (
    <div className="bg-white px-4 py-4 dark:bg-[var(--color-ink-900)] sm:px-5">
      <div className="flex items-center gap-2 text-[11px] font-medium text-[color:var(--muted-foreground)]">
        <span className="text-[var(--color-slate-blue-500)]" aria-hidden="true">{icon}</span>
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold tracking-tight tabular sm:text-3xl">{value}</span>
        <span className="text-xs text-[color:var(--muted)]">{unit}</span>
      </div>
      <p className="mt-1 text-[10px] text-[color:var(--muted)]">{helper}</p>
    </div>
  );
}

function RecentWorkout({
  workout,
  featured,
  onOpen,
}: {
  workout: WorkoutWithPtNumber;
  featured: boolean;
  onOpen: () => void;
}) {
  const parsedDate = safeDate(workout.date);
  const detail = workout.lessonContent?.trim() || workout.notes?.trim();
  const exercises = workout.exercises ?? [];
  const cardioExercises = workout.cardioExercises ?? [];

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group w-full rounded-xl border p-3.5 text-left transition-colors hover:border-[var(--color-slate-blue-500)]/40 ${
        featured
          ? "border-[var(--color-slate-blue-500)]/25 bg-[var(--color-slate-blue-500)]/[0.06]"
          : "border-black/6 bg-black/[0.015] dark:border-white/6 dark:bg-white/[0.02]"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white ${
            workout.category === "PT" ? "bg-[var(--color-wine-500)]" : "bg-[var(--color-slate-blue-500)]"
          }`}
        >
          {workout.category === "PT" ? <Dumbbell size={14} /> : <User size={14} />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-sm font-semibold">{workout.type || "운동"}</span>
                {workout.category === "PT" && (
                  <span className="rounded bg-[var(--color-wine-500)]/10 px-1.5 py-0.5 text-[9px] font-semibold text-[var(--color-wine-600)] dark:text-[var(--color-wine-400)]">
                    PT{workout.ptNumber ? ` ${workout.ptNumber}회` : ""}
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[10px] text-[color:var(--muted)] tabular">
                <span>{parsedDate ? format(parsedDate, "M.d (E)", { locale: ko }) : workout.date}</span>
                <span>
                  {Number(workout.duration) || 0}분{workout.durationDerivedFromCardio ? "(유산소 기록)" : ""}
                </span>
                {workout.caloriesBurned != null && <span>{workout.caloriesBurned} kcal</span>}
              </div>
            </div>
            <ArrowRight size={14} className="mt-1 shrink-0 text-[color:var(--muted)] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </div>
          {(exercises.length > 0 || cardioExercises.length > 0) && (
            <div className="mt-2 space-y-1.5 rounded-lg bg-white/70 px-2.5 py-2 dark:bg-black/10">
              {exercises.slice(0, featured ? 3 : 2).map((exercise) => (
                <div key={exercise.id} className="text-[10px] leading-relaxed">
                  <span className="font-semibold text-[color:var(--foreground)]">{exercise.name}</span>
                  <span className="ml-1 text-[color:var(--muted-foreground)] tabular">
                    {summarizeSets(exercise.sets)}
                  </span>
                </div>
              ))}
              {exercises.length > (featured ? 3 : 2) && (
                <div className="text-[9px] text-[color:var(--muted)]">외 {exercises.length - (featured ? 3 : 2)}종목</div>
              )}
              {cardioExercises.slice(0, 1).map((exercise) => (
                <div key={exercise.id} className="border-t border-black/5 pt-1.5 text-[10px] leading-relaxed dark:border-white/5">
                  <span className="font-semibold text-[color:var(--foreground)]">{exercise.name}</span>
                  <span className="ml-1 text-[color:var(--muted-foreground)] tabular">
                    {summarizeCardio(exercise)}
                  </span>
                </div>
              ))}
            </div>
          )}
          {detail && exercises.length === 0 && cardioExercises.length === 0 && (
            <p className={`mt-2 whitespace-pre-line text-[11px] leading-relaxed text-[color:var(--muted-foreground)] ${featured ? "line-clamp-3" : "line-clamp-1"}`}>
              {detail}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function WorkoutTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; value?: number; payload?: WeeklyWorkoutPoint }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;
  return (
    <div className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-xs shadow-lg dark:border-white/10 dark:bg-[var(--color-ink-900)]">
      <div className="mb-1.5 font-semibold">{label} 주</div>
      <div className="space-y-0.5 text-[11px] text-[color:var(--muted-foreground)] tabular">
        <div>개인 운동 {point?.personal ?? 0}분</div>
        <div>PT {point?.pt ?? 0}분</div>
        <div>총 {point?.sessions ?? 0}회</div>
      </div>
    </div>
  );
}

