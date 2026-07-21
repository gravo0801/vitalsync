"use client";
import { useEffect } from "react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  zIndex?: number;
  maxWidth?: "md" | "lg";
}

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  zIndex = 50,
  maxWidth = "md",
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ zIndex }}
      onClick={onClose}
    >
      <div
        className={`
          rounded-t-3xl sm:rounded-2xl w-full ${maxWidth === "lg" ? "sm:max-w-2xl" : "sm:max-w-md"}
          bg-white dark:bg-[var(--color-ink-900)]
          border border-black/5 dark:border-white/8
          shadow-xl max-h-[90vh] overflow-y-auto
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-[var(--color-ink-900)] border-b border-black/5 dark:border-white/5 px-6 py-4 flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold tracking-tight">{title}</h3>
            {subtitle && (
              <p className="text-xs text-[color:var(--muted)] mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 -mr-1.5"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// 공통 input 스타일
export const inputClass = `
  w-full px-3.5 py-2.5 rounded-xl
  bg-[var(--color-cream-50)] dark:bg-white/5
  border border-black/8 dark:border-white/10
  text-[color:var(--foreground)]
  placeholder:text-[color:var(--muted)]/60
  outline-none
  focus:border-[var(--color-sage-500)] focus:ring-2 focus:ring-[var(--color-sage-500)]/20
  transition-all
`.replace(/\s+/g, " ").trim();

export const labelClass = "text-xs font-medium text-[color:var(--muted-foreground)] mb-1.5 block";

// 공통 버튼
export function PrimaryButton({
  children, onClick, disabled, color = "sage",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  color?: "sage" | "terra" | "slate-blue" | "wine";
}) {
  const colorMap = {
    sage: "bg-[var(--color-sage-500)] hover:bg-[var(--color-sage-600)]",
    terra: "bg-[var(--color-terra-500)] hover:bg-[var(--color-terra-600)]",
    "slate-blue": "bg-[var(--color-slate-blue-500)] hover:bg-[var(--color-slate-blue-600)]",
    wine: "bg-[var(--color-wine-500)] hover:bg-[var(--color-wine-600)]",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 py-3 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50 ${colorMap[color]}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children, onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 py-3 rounded-xl text-sm font-medium bg-black/5 dark:bg-white/5 hover:bg-black/8 dark:hover:bg-white/8 transition-colors"
    >
      {children}
    </button>
  );
}
