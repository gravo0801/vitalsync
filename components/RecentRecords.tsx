"use client";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { toast } from "sonner";
import type { WeightRecord, MealRecord } from "@/types";
import { Card } from "./SummaryCards";

interface Props {
  weights: WeightRecord[];
  meals: MealRecord[];
  onDeleteWeight: (id: string) => Promise<void>;
  onDeleteMeal: (meal: MealRecord) => Promise<void>;
}

export default function RecentRecords({
  weights, meals, onDeleteWeight, onDeleteMeal,
}: Props) {
  const handleDeleteWeight = async (id: string) => {
    if (!confirm("정말 삭제하시겠어요?")) return;
    try {
      await onDeleteWeight(id);
      toast.success("삭제되었습니다");
    } catch {
      toast.error("삭제 실패");
    }
  };

  const handleDeleteMeal = async (meal: MealRecord) => {
    if (!confirm("정말 삭제하시겠어요?")) return;
    try {
      await onDeleteMeal(meal);
      toast.success("삭제되었습니다");
    } catch {
      toast.error("삭제 실패");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
      <Card>
        <h3 className="text-base font-semibold tracking-tight mb-3">
          최근 <span className="serif-italic">체중</span>
        </h3>
        {weights.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)] py-3">기록이 없습니다.</p>
        ) : (
          <div className="space-y-1">
            {[...weights].reverse().slice(0, 5).map((w) => (
              <RecordRow
                key={w.id}
                onDelete={() => handleDeleteWeight(w.id)}
              >
                <div className="flex flex-col">
                  <span className="text-sm">
                    {format(new Date(w.date), "yyyy.MM.dd (E)", { locale: ko })}
                  </span>
                  {w.memo && (
                    <span className="text-xs text-[color:var(--muted)] mt-0.5">{w.memo}</span>
                  )}
                </div>
                <span className="font-semibold tabular text-sm">{w.weight} <span className="text-xs font-normal text-[color:var(--muted)]">kg</span></span>
              </RecordRow>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-base font-semibold tracking-tight mb-3">
          최근 <span className="serif-italic">식사</span>
        </h3>
        {meals.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)] py-3">기록이 없습니다.</p>
        ) : (
          <div className="space-y-1">
            {meals.slice(0, 4).map((meal) => (
              <RecordRow
                key={meal.id}
                onDelete={() => handleDeleteMeal(meal)}
              >
                {meal.photoURL && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={meal.photoURL} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{meal.mealType}</span>
                    <span className="text-xs text-[color:var(--muted)]">
                      {format(new Date(meal.date), "MM.dd", { locale: ko })}
                    </span>
                  </div>
                  {meal.content && (
                    <div className="text-xs text-[color:var(--muted-foreground)] mt-0.5 line-clamp-1">
                      {meal.content}
                    </div>
                  )}
                </div>
                {meal.calories != null && (
                  <span className="text-xs tabular text-[var(--color-terra-600)] dark:text-[var(--color-terra-400)] shrink-0">
                    {meal.calories} kcal
                  </span>
                )}
              </RecordRow>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function RecordRow({
  children, onDelete,
}: {
  children: React.ReactNode;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-black/3 dark:hover:bg-white/5 group">
      <div className="flex-1 flex items-center gap-3 justify-between">{children}</div>
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-[var(--color-wine-500)]/10"
        aria-label="삭제"
      >
        <Trash2 size={13} className="text-[var(--color-wine-500)]" />
      </button>
    </div>
  );
}
