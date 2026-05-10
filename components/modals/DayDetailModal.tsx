"use client";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { Trash2, Plus, Dumbbell, User } from "lucide-react";
import { toast } from "sonner";
import Modal from "./Modal";
import type { WeightRecord, MealRecord, WorkoutWithPtNumber, MedicationRecord } from "@/types";

const SITE_LABEL: Record<string, string> = {
  abdomen: "복부",
  thigh: "허벅지",
  upper_arm: "상완",
};

interface Props {
  open: boolean;
  onClose: () => void;
  date: string | null;
  weights: WeightRecord[];
  meals: MealRecord[];
  workouts: WorkoutWithPtNumber[];
  medications?: MedicationRecord[];
  onAddWeight: () => void;
  onAddMeal: () => void;
  onAddWorkout: () => void;
  onAddMedication?: () => void;
  onDeleteWeight: (id: string) => Promise<void>;
  onDeleteMeal: (meal: MealRecord) => Promise<void>;
  onDeleteWorkout: (id: string) => Promise<void>;
  onDeleteMedication?: (id: string) => Promise<void>;
}

export default function DayDetailModal({
  open, onClose, date, weights, meals, workouts, medications = [],
  onAddWeight, onAddMeal, onAddWorkout, onAddMedication,
  onDeleteWeight, onDeleteMeal, onDeleteWorkout, onDeleteMedication,
}: Props) {
  if (!date) return null;

  const dayWeights = weights.filter((w) => w.date === date);
  const dayMeals = meals.filter((m) => m.date === date);
  const dayWorkouts = workouts.filter((w) => w.date === date);
  const dayMedications = medications.filter((m) => m.date === date);

  const totalKcalIn = dayMeals.reduce((s, m) => s + (m.calories || 0), 0);
  const totalKcalOut = dayWorkouts.reduce((s, w) => s + (w.caloriesBurned || 0), 0);

  const handleDelete = async (fn: () => Promise<void>) => {
    if (!confirm("정말 삭제하시겠어요?")) return;
    try {
      await fn();
      toast.success("삭제되었습니다");
    } catch {
      toast.error("삭제 실패");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={format(parseISO(date), "yyyy년 MM월 dd일", { locale: ko })}
      subtitle={format(parseISO(date), "EEEE", { locale: ko })}
    >
      <div className="space-y-5">
        {/* 일일 칼로리 요약 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl p-3.5 bg-[var(--color-terra-50)] dark:bg-[var(--color-terra-500)]/10 border border-[var(--color-terra-500)]/20">
            <div className="text-[11px] text-[var(--color-terra-600)] dark:text-[var(--color-terra-400)] tracking-wide">
              섭취
            </div>
            <div className="text-xl font-semibold text-[var(--color-terra-600)] dark:text-[var(--color-terra-400)] tabular mt-0.5">
              {totalKcalIn.toLocaleString()} <span className="text-xs font-normal">kcal</span>
            </div>
          </div>
          <div className="rounded-xl p-3.5 bg-[var(--color-slate-blue-50)] dark:bg-[var(--color-slate-blue-500)]/10 border border-[var(--color-slate-blue-500)]/20">
            <div className="text-[11px] text-[var(--color-slate-blue-600)] dark:text-[var(--color-slate-blue-400)] tracking-wide">
              소모
            </div>
            <div className="text-xl font-semibold text-[var(--color-slate-blue-600)] dark:text-[var(--color-slate-blue-400)] tabular mt-0.5">
              {totalKcalOut.toLocaleString()} <span className="text-xs font-normal">kcal</span>
            </div>
          </div>
        </div>

        <Section title="체중" onAdd={onAddWeight}>
          {dayWeights.length === 0 ? (
            <Empty />
          ) : (
            dayWeights.map((w) => (
              <Row key={w.id} onDelete={() => handleDelete(() => onDeleteWeight(w.id))}>
                <span className="font-semibold tabular">
                  {w.weight} <span className="text-xs font-normal text-[color:var(--muted)]">kg</span>
                </span>
                {w.memo && (
                  <span className="text-xs text-[color:var(--muted)] ml-2">{w.memo}</span>
                )}
              </Row>
            ))
          )}
        </Section>

        <Section title="식사" onAdd={onAddMeal}>
          {dayMeals.length === 0 ? (
            <Empty />
          ) : (
            dayMeals.map((m) => (
              <Row key={m.id} onDelete={() => handleDelete(() => onDeleteMeal(m))}>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{m.mealType}</span>
                    {m.calories != null && (
                      <span className="text-xs tabular text-[var(--color-terra-600)] dark:text-[var(--color-terra-400)]">
                        {m.calories} kcal
                      </span>
                    )}
                  </div>
                  {m.content && (
                    <span className="text-xs text-[color:var(--muted-foreground)] mt-0.5 truncate">
                      {m.content}
                    </span>
                  )}
                </div>
              </Row>
            ))
          )}
        </Section>

        <Section title="운동" onAdd={onAddWorkout}>
          {dayWorkouts.length === 0 ? (
            <Empty />
          ) : (
            dayWorkouts.map((w) => (
              <Row key={w.id} onDelete={() => handleDelete(() => onDeleteWorkout(w.id))}>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* ⭐ 카테고리 뱃지 */}
                    {w.category === "PT" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[var(--color-wine-500)] text-white px-1.5 py-0.5 rounded">
                        <Dumbbell size={9} />
                        PT
                        {w.ptNumber && <span className="tabular">{w.ptNumber}회차</span>}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[var(--color-sage-500)] text-white px-1.5 py-0.5 rounded">
                        <User size={9} />
                        개인
                      </span>
                    )}
                    <span className="text-sm font-medium">{w.type || "운동"}</span>
                    <span className="text-xs text-[color:var(--muted)] tabular">{w.duration}분</span>
                    {w.caloriesBurned != null && (
                      <span className="text-xs tabular text-[var(--color-slate-blue-600)] dark:text-[var(--color-slate-blue-400)]">
                        {w.caloriesBurned} kcal
                      </span>
                    )}
                  </div>
                  {w.lessonContent && (
                    <div className="text-xs mt-1 px-2 py-1.5 rounded-md bg-[var(--color-wine-500)]/8 border-l-2 border-[var(--color-wine-500)]/40">
                      <span className="text-[10px] font-semibold text-[var(--color-wine-500)] mr-1">수업</span>
                      <span className="text-[color:var(--foreground)] whitespace-pre-line">{w.lessonContent}</span>
                    </div>
                  )}
                  {w.notes && (
                    <div className="text-xs text-[color:var(--muted-foreground)] mt-1 whitespace-pre-line">
                      {w.notes}
                    </div>
                  )}
                </div>
              </Row>
            ))
          )}
        </Section>

        {onAddMedication && (
          <Section title="Mounjaro" onAdd={onAddMedication}>
            {dayMedications.length === 0 ? (
              <Empty />
            ) : (
              dayMedications.map((m) => (
                <Row
                  key={m.id}
                  onDelete={() =>
                    onDeleteMedication
                      ? handleDelete(() => onDeleteMedication(m.id))
                      : Promise.resolve()
                  }
                >
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center text-[10px] font-semibold bg-[var(--color-mauve-500)] text-white px-1.5 py-0.5 rounded">
                        Mounjaro
                      </span>
                      <span className="text-sm font-semibold tabular text-[var(--color-mauve-500)]">
                        {m.doseMg} <span className="text-xs font-normal text-[color:var(--muted)]">mg</span>
                      </span>
                      {m.injectionSite && (
                        <span className="text-xs text-[color:var(--muted)]">
                          {SITE_LABEL[m.injectionSite]}
                        </span>
                      )}
                      {m.weightKgAtInjection != null && (
                        <span className="text-xs tabular text-[var(--color-sage-600)] dark:text-[var(--color-sage-400)]">
                          {m.weightKgAtInjection} kg
                        </span>
                      )}
                    </div>
                    {m.sideEffects && (
                      <span className="text-xs text-[color:var(--muted-foreground)] mt-0.5 truncate">
                        {m.sideEffects}
                      </span>
                    )}
                  </div>
                </Row>
              ))
            )}
          </Section>
        )}
      </div>

      <button
        onClick={onClose}
        className="w-full mt-6 py-3 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/8 text-sm font-medium"
      >
        닫기
      </button>
    </Modal>
  );
}

function Section({ title, onAdd, children }: { title: string; onAdd: () => void; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <h4 className="text-xs font-semibold text-[color:var(--muted-foreground)] tracking-wide uppercase">
          {title}
        </h4>
        <button
          onClick={onAdd}
          className="flex items-center gap-1 text-[11px] text-[var(--color-sage-600)] dark:text-[var(--color-sage-400)] hover:underline"
        >
          <Plus size={11} /> 추가
        </button>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-cream-50)] dark:bg-white/3 group">
      <div className="flex-1 flex items-center min-w-0">{children}</div>
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-[var(--color-wine-500)]/10 shrink-0"
      >
        <Trash2 size={12} className="text-[var(--color-wine-500)]" />
      </button>
    </div>
  );
}

function Empty() {
  return (
    <div className="text-xs text-[color:var(--muted)] px-3 py-2.5 italic">
      기록 없음
    </div>
  );
}
