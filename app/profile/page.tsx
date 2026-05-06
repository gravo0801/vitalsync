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
import Sidebar from "@/components/Sidebar";
import { Card } from "@/components/SummaryCards";
import { inputClass, labelClass } from "@/components/modals/Modal";

const ACTIVITY_LEVELS: ActivityLevel[] = [
  "sedentary", "light", "moderate", "active", "veryActive",
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
    } catch {
      toast.error("저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  const age = calculateAge(form.birthDate);
  const bmi = calculateBMI(form.startWeightKg, form.heightCm);
  const cat = bmiCategory(bmi);
  const bmr = Math.round(calculateBMR(form, form.startWeightKg));
  const tdee = Math.round(calculateTDEE(form, form.startWeightKg));
  const target = calculateDailyTarget(form, form.startWeightKg);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[color:var(--muted)]">
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6 pl-12 lg:pl-0">
            <Link
              href="/"
              className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <p className="text-xs text-[color:var(--muted)]">설정</p>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                <span className="serif-italic text-[var(--color-terra-600)]">프로필</span> 설정
              </h1>
            </div>
          </div>

          {/* 미리보기 카드 */}
          <Card accentColor="sage" className="mb-5">
            <div className="text-xs text-[color:var(--muted)] tracking-wide mb-3">
              자동 계산 <span className="serif-italic">미리보기</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <Info label="나이" value={`${age}세`} />
              <Info label="BMI" value={bmi.toFixed(1)} sub={cat.label} subColor={cat.color} />
              <Info label="BMR" value={`${bmr.toLocaleString()}`} unit="kcal" />
              <Info label="TDEE" value={`${tdee.toLocaleString()}`} unit="kcal" />
            </div>
            <div className="pt-4 border-t border-black/5 dark:border-white/5">
              <div className="text-xs text-[color:var(--muted)]">일일 권장 섭취</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-semibold tabular text-[var(--color-sage-600)] dark:text-[var(--color-sage-400)]">
                  {target.toLocaleString()}
                </span>
                <span className="text-sm text-[color:var(--muted)]">kcal</span>
              </div>
              <div className="text-[11px] text-[color:var(--muted)] mt-1">
                주 {((form.weeklyDeficitKcal ?? 3500) / 7700).toFixed(2)}kg 감량 페이스
              </div>
            </div>
          </Card>

          {/* 입력 폼 */}
          <Card>
            <div className="space-y-4">
              <Field label="이름">
                <input
                  type="text"
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="성별">
                <div className="grid grid-cols-2 gap-1.5">
                  {(["male", "female"] as Sex[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setForm({ ...form, sex: s })}
                      className={`py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        form.sex === s
                          ? "bg-[var(--color-ink-900)] dark:bg-white/15 text-white"
                          : "bg-black/4 dark:bg-white/5"
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
                  className={inputClass}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="키 (cm)">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={form.heightCm}
                    onChange={(e) => setForm({ ...form, heightCm: parseFloat(e.target.value) || 0 })}
                    className={inputClass}
                  />
                </Field>
                <Field label="현재 체중 (kg)">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={form.startWeightKg}
                    onChange={(e) => setForm({ ...form, startWeightKg: parseFloat(e.target.value) || 0 })}
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="목표 체중 (kg)">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={form.targetWeightKg}
                  onChange={(e) => setForm({ ...form, targetWeightKg: parseFloat(e.target.value) || 0 })}
                  className={inputClass}
                />
              </Field>

              <Field label="활동 수준">
                <div className="space-y-1.5">
                  {ACTIVITY_LEVELS.map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setForm({ ...form, activityLevel: lvl })}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm transition-colors ${
                        form.activityLevel === lvl
                          ? "bg-[var(--color-ink-900)] dark:bg-white/15 text-white"
                          : "bg-black/4 dark:bg-white/5 hover:bg-black/8 dark:hover:bg-white/10"
                      }`}
                    >
                      {ACTIVITY_LABEL[lvl]}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="감량 페이스">
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: "여유", sub: "0.25kg/주", val: 1750 },
                    { label: "표준", sub: "0.5kg/주", val: 3500 },
                    { label: "공격적", sub: "0.75kg/주", val: 5250 },
                  ].map((p) => (
                    <button
                      key={p.val}
                      onClick={() => setForm({ ...form, weeklyDeficitKcal: p.val })}
                      className={`py-2.5 px-2 rounded-xl text-xs font-medium transition-colors flex flex-col items-center ${
                        (form.weeklyDeficitKcal ?? 3500) === p.val
                          ? "bg-[var(--color-sage-500)] text-white"
                          : "bg-black/4 dark:bg-white/5"
                      }`}
                    >
                      <span>{p.label}</span>
                      <span className="text-[10px] opacity-70 mt-0.5">{p.sub}</span>
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </Card>

          <button
            onClick={submit}
            disabled={saving}
            className="w-full mt-5 py-3.5 rounded-xl bg-[var(--color-ink-900)] dark:bg-white/15 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "저장 중..." : "저장하기"}
          </button>
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function Info({
  label, value, unit, sub, subColor,
}: {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  subColor?: string;
}) {
  return (
    <div>
      <div className="text-[11px] text-[color:var(--muted)]">{label}</div>
      <div className="font-semibold text-base tabular mt-0.5">
        {value}
        {unit && <span className="text-xs font-normal text-[color:var(--muted)] ml-1">{unit}</span>}
      </div>
      {sub && <div className={`text-[11px] ${subColor}`}>{sub}</div>}
    </div>
  );
}
