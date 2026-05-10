"use client";
import { Plus } from "lucide-react";

interface Props {
  onAddWeight: () => void;
  onAddMeal: () => void;
  onAddWorkout: () => void;
  onAddMedication?: () => void;
  greeting?: string;
  name?: string;
}

export default function PageHeader({
  onAddWeight, onAddMeal, onAddWorkout, onAddMedication, greeting, name,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
      <div className="pl-12 lg:pl-0">
        <p className="text-sm text-[color:var(--muted)]">
          안녕하세요, <span className="text-[color:var(--foreground)]">{name || "그라보"}</span>님 👋
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-1">
          오늘의 <span className="serif-italic text-[color:var(--color-terra-600)]">{greeting || "건강 현황"}</span>
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <ActionButton onClick={onAddWeight} color="sage">체중</ActionButton>
        <ActionButton onClick={onAddMeal} color="terra">식사</ActionButton>
        <ActionButton onClick={onAddWorkout} color="slate-blue">운동</ActionButton>
        {onAddMedication && (
          <ActionButton onClick={onAddMedication} color="wine">주사</ActionButton>
        )}
      </div>
    </div>
  );
}

function ActionButton({
  onClick, color, children,
}: {
  onClick: () => void;
  color: "sage" | "terra" | "slate-blue" | "wine";
  children: React.ReactNode;
}) {
  const colorMap = {
    sage: "hover:border-[var(--color-sage-500)] hover:text-[var(--color-sage-600)] dark:hover:text-[var(--color-sage-400)]",
    terra: "hover:border-[var(--color-terra-500)] hover:text-[var(--color-terra-600)] dark:hover:text-[var(--color-terra-400)]",
    "slate-blue": "hover:border-[var(--color-slate-blue-500)] hover:text-[var(--color-slate-blue-600)] dark:hover:text-[var(--color-slate-blue-400)]",
    wine: "hover:border-[var(--color-wine-500)] hover:text-[var(--color-wine-600)] dark:hover:text-[var(--color-wine-400)]",
  };

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium
        bg-white dark:bg-white/5
        border border-black/8 dark:border-white/10
        text-[color:var(--foreground)]
        transition-colors
        ${colorMap[color]}
      `}
    >
      <Plus size={14} />
      {children}
    </button>
  );
}
