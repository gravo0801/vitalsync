"use client";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { toast } from "sonner";
import type { WeightRecord, MealRecord } from "@/types";

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

  const cardClass =
    "rounded-3xl p-6 bg-white dark:bg-zinc-900 border border-amber-200 dark:border-zinc-800 shadow-sm";
  const itemClass =
    "flex justify-between items-center px-4 py-3 rounded-2xl bg-amber-50 dark:bg-zinc-950 group";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div className={cardClass}>
        <h3 className="font-semibold mb-4">최근 체중 기록</h3>
        {weights.length === 0 ? (
          <p className="text-stone-500 dark:text-zinc-400">기록이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {[...weights].reverse().slice(0, 5).map((w) => (
              <div key={w.id} className={itemClass}>
                <div className="flex flex-col">
                  <span className="text-sm">
                    {format(new Date(w.date), "yyyy년 MM월 dd일 (E)", { locale: ko })}
                  </span>
                  {w.memo && (
                    <span className="text-xs text-stone-500 dark:text-zinc-400">{w.memo}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold">{w.weight} kg</span>
                  <button
                    onClick={() => handleDeleteWeight(w.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                    aria-label="삭제"
                  >
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={cardClass}>
        <h3 className="font-semibold mb-4">최근 식사 기록</h3>
        {meals.length === 0 ? (
          <p className="text-stone-500 dark:text-zinc-400">기록이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {meals.slice(0, 4).map((meal) => (
              <div key={meal.id} className="flex gap-3 rounded-2xl overflow-hidden bg-amber-50 dark:bg-zinc-950 group">
                {meal.photoURL && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={meal.photoURL} alt="" className="w-20 h-20 object-cover shrink-0" />
                )}
                <div className="flex-1 py-3 pr-3 flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-sm">
                      {meal.mealType}
                      <span className="text-xs text-stone-500 dark:text-zinc-400 ml-2">
                        {format(new Date(meal.date), "MM/dd", { locale: ko })}
                      </span>
                    </div>
                    {meal.content && (
                      <div className="text-xs text-stone-600 dark:text-zinc-300 mt-1 line-clamp-2">
                        {meal.content}
                      </div>
                    )}
                    {meal.calories != null && (
                      <div className="text-emerald-500 text-xs mt-1">{meal.calories} kcal</div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteMeal(meal)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg shrink-0"
                    aria-label="삭제"
                  >
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
