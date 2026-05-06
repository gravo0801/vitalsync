"use client";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import Modal from "./Modal";
import type { WeightRecord, MealRecord, WorkoutRecord } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  date: string | null;
  weights: WeightRecord[];
  meals: MealRecord[];
  workouts: WorkoutRecord[];
  onAddWeight: () => void;
  onAddMeal: () => void;
  onAddWorkout: () => void;
  onDeleteWeight: (id: string) => Promise<void>;
  onDeleteMeal: (meal: MealRecord) => Promise<void>;
  onDeleteWorkout: (id: string) => Promise<void>;
}

export default function DayDetailModal({
  open, onClose, date, weights, meals, workouts,
  onAddWeight, onAddMeal, onAddWorkout,
  onDeleteWeight, onDeleteMeal, onDeleteWorkout,
}: Props) {
  if (!date) return null;

  const dayWeights = weights.filter((w) => w.date === date);
  const dayMeals = meals.filter((m) => m.date === date);
  const dayWorkouts = workouts.filter((w) => w.date === date);

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
      title={format(new Date(date), "yyyy년 MM월 dd일 (E)", { locale: ko })}
    >
      <div className="space-y-5">
        {/* 일일 칼로리 요약 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4 bg-orange-50 dark:bg-orange-950/30">
            <div className="text-xs text-orange-600 dark:text-orange-400">섭취</div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {totalKcalIn.toLocaleString()} <span className="text-sm">kcal</span>
            </div>
          </div>
          <div className="rounded-2xl p-4 bg-blue-50 dark:bg-blue-950/30">
            <div className="text-xs text-blue-600 dark:text-blue-400">소모</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {totalKcalOut.toLocaleString()} <span className="text-sm">kcal</span>
            </div>
          </div>
        </div>

        {/* 체중 */}
        <Section title="체중" onAdd={onAddWeight}>
          {dayWeights.length === 0 ? (
            <Empty text="기록 없음" />
          ) : (
            dayWeights.map((w) => (
              <Row key={w.id} onDelete={() => handleDelete(() => onDeleteWeight(w.id))}>
                <span className="font-mono font-semibold">{w.weight} kg</span>
                {w.memo && (
                  <span className="text-xs text-stone-500 dark:text-zinc-400 ml-2">
                    {w.memo}
                  </span>
                )}
              </Row>
            ))
          )}
        </Section>

        {/* 식사 */}
        <Section title="식사" onAdd={onAddMeal}>
          {dayMeals.length === 0 ? (
            <Empty text="기록 없음" />
          ) : (
            dayMeals.map((m) => (
              <Row key={m.id} onDelete={() => handleDelete(() => onDeleteMeal(m))}>
                <div className="flex flex-col flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{m.mealType}</span>
                    {m.calories != null && (
                      <span className="text-xs text-emerald-500">{m.calories} kcal</span>
                    )}
                  </div>
                  {m.content && (
                    <span className="text-xs text-stone-600 dark:text-zinc-300 mt-0.5">
                      {m.content}
                    </span>
                  )}
                </div>
              </Row>
            ))
          )}
        </Section>

        {/* 운동 */}
        <Section title="운동" onAdd={onAddWorkout}>
          {dayWorkouts.length === 0 ? (
            <Empty text="기록 없음" />
          ) : (
            dayWorkouts.map((w) => (
              <Row key={w.id} onDelete={() => handleDelete(() => onDeleteWorkout(w.id))}>
                <div className="flex flex-col flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{w.type || "운동"}</span>
                    <span className="text-xs text-stone-500">{w.duration}분</span>
                    {w.caloriesBurned != null && (
                      <span className="text-xs text-blue-500">{w.caloriesBurned} kcal</span>
                    )}
                  </div>
                  {w.notes && (
                    <span className="text-xs text-stone-600 dark:text-zinc-300 mt-0.5">
                      {w.notes}
                    </span>
                  )}
                </div>
              </Row>
            ))
          )}
        </Section>
      </div>

      <button
        onClick={onClose}
        className="w-full mt-6 py-3.5 rounded-2xl bg-stone-200 dark:bg-zinc-800"
      >
        닫기
      </button>
    </Modal>
  );
}

function Section({
  title, onAdd, children,
}: {
  title: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-sm text-stone-600 dark:text-zinc-300">{title}</h4>
        <button
          onClick={onAdd}
          className="flex items-center gap-1 text-xs text-emerald-500 hover:underline"
        >
          <Plus size={12} /> 추가
        </button>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-50 dark:bg-zinc-950 group">
      <div className="flex-1">{children}</div>
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
      >
        <Trash2 size={14} className="text-red-500" />
      </button>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="text-xs text-stone-400 dark:text-zinc-500 px-3 py-2">{text}</div>
  );
}
