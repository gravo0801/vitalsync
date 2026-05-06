"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import {
  ACTIVITY_LABEL,
  calculateAge,
  calculateBMI,
  bmiCategory,
  calculateBMR,
  calculateTDEE,
  calculateDailyTarget,
} from "@/lib/calculations";
import type { UserProfile, ActivityLevel, Sex } from "@/types";
import ThemeToggle from "@/components/ThemeToggle";

const ACTIVITY_LEVELS: ActivityLevel[] = [
  "sedentary",
  "light",
  "moderate",
  "active",
  "veryActive",
];

const DEFAULT_PROFILE: UserProfile = {
  name: "그라보",
  sex: "male",
  birthDate: "1980-01-01",
  heightCm: 176,
  startWeightKg: 98,
  targetWeightKg: 90,
  activityLevel: "light",
  weeklyDeficitKcal: 3500,
};

export default function ProfilePage() {
  const router = useRouter();
  const { profile, loading, saveProfile } = useProfile();
  const [form, setForm] = useState<UserProfile>(DEFAULT_PROFILE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  const submit = async () => {
    setSaving(true);
    try {
      await saveProfile(form);
      toast.success("프로필이 저장되었습니다");
      router.push("/");
    } catch (e) {
      console.error(e);
      toast.error("저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  // 미리보기 계산
  const age = calculateAge(form.birthDate);
  const bmi = calculateBMI(form.startWeightKg, form.heightCm);
  const cat = bmiCategory(bmi);
  const bmr = Math.round(calculateBMR(form, form.startWeightKg));
  const tdee = Math.round(calculateTDEE(form, form.startWeightKg));
  const target = calculateDailyTarget(form, form.startWeightKg);

  const inputCls =
    "w-full bg-amber-50 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">로딩 중...</div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-amber-200 dark:border-zinc-800 bg-amber-100/90 dark:bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl hover:bg-amber-200 dark:hover:bg-zinc-800"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="font-semibold text-xl">프로필 설정</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* 미리보기 카드 */}
        <div className="rounded-3xl p-6 mb-6 bg-emerald-500/10 border border-emerald-500/30">
          <h3 className="font-semibold mb-3 text-emerald-700 dark:text-emerald-400">
            자동 계산 미리보기
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <Info label="나이" value={`${age}세`} />
            <Info label="BMI" value={bmi.toFixed(1)} sub={cat.label} subColor={cat.color} />
            <Info label="기초대사량 (BMR)" value={`${bmr.toLocaleString()} kcal`} />
            <Info label="활동대사량 (TDEE)" value={`${tdee.toLocaleString()} kcal`} />
          </div>
          <div className="mt-4 pt-4 border-t border-emerald-500/20">
            <div className="text-xs text-stone-500 dark:text-zinc-400">일일 권장 섭취</div>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {target.toLocaleString()} <span className="text-base font-normal">kcal</span>
            </div>
            <div className="text-xs text-stone-500 dark:text-zinc-400 mt-1">
              주 {((form.weeklyDeficitKcal ?? 3500) / 7700).toFixed(1)}kg 감량 페이스 기준
            </div>
          </div>
        </div>

        {/* 입력 폼 */}
        <div className="space-y-5 rounded-3xl p-6 bg-white dark:bg-zinc-900 border border-amber-200 dark:border-zinc-800">
          <Field label="이름">
            <input
              type="text"
              value={form.name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
            />
          </Field>

          <Field label="성별">
            <div className="grid grid-cols-2 gap-2">
              {(["male", "female"] as Sex[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setForm({ ...form, sex: s })}
                  className={`py-3 rounded-xl font-medium transition ${
                    form.sex === s
                      ? "bg-emerald-500 text-white"
                      : "bg-amber-100 dark:bg-zinc-800"
                  }`}
                >
                  {s === "male" ? "남성" : "여성"}
                </button>
              ))}
            </div>
          </Field>

          <Field label="생년월일">
            <input
              type="date"
              value={form.birthDate}
              onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="키 (cm)">
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={form.heightCm}
                onChange={(e) =>
                  setForm({ ...form, heightCm: parseFloat(e.target.value) || 0 })
                }
                className={inputCls}
              />
            </Field>
            <Field label="현재 체중 (kg)">
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={form.startWeightKg}
                onChange={(e) =>
                  setForm({ ...form, startWeightKg: parseFloat(e.target.value) || 0 })
                }
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="목표 체중 (kg)">
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={form.targetWeightKg}
              onChange={(e) =>
                setForm({ ...form, targetWeightKg: parseFloat(e.target.value) || 0 })
              }
              className={inputCls}
            />
          </Field>

          <Field label="활동 수준">
            <div className="space-y-2">
              {ACTIVITY_LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setForm({ ...form, activityLevel: lvl })}
                  className={`w-full text-left px-4 py-3 rounded-xl transition ${
                    form.activityLevel === lvl
                      ? "bg-emerald-500 text-white"
                      : "bg-amber-100 dark:bg-zinc-800 hover:bg-amber-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {ACTIVITY_LABEL[lvl]}
                </button>
              ))}
            </div>
          </Field>

          <Field label="감량 페이스">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "여유 (0.25kg/주)", val: 1750 },
                { label: "표준 (0.5kg/주)", val: 3500 },
                { label: "공격적 (0.75kg/주)", val: 5250 },
              ].map((p) => (
                <button
                  key={p.val}
                  onClick={() => setForm({ ...form, weeklyDeficitKcal: p.val })}
                  className={`py-3 rounded-xl text-xs font-medium transition ${
                    (form.weeklyDeficitKcal ?? 3500) === p.val
                      ? "bg-emerald-500 text-white"
                      : "bg-amber-100 dark:bg-zinc-800"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <button
          onClick={submit}
          disabled={saving}
          className="w-full mt-6 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold disabled:opacity-50"
        >
          {saving ? "저장 중..." : "저장하기"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm text-stone-500 dark:text-zinc-400 mb-1.5 block font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

function Info({
  label, value, sub, subColor,
}: {
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
}) {
  return (
    <div>
      <div className="text-xs text-stone-500 dark:text-zinc-400">{label}</div>
      <div className="font-semibold text-base">{value}</div>
      {sub && <div className={`text-xs ${subColor}`}>{sub}</div>}
    </div>
  );
}
