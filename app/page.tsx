"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Plus, TrendingDown, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Sun, Moon } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from "date-fns";
import { ko } from "date-fns/locale";
import { db } from "@/lib/firebase";
import {
  collection, addDoc, onSnapshot, query, where, orderBy, Timestamp,
  getDocs, deleteDoc, doc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

// ==================== 타입 ====================
interface WeightData { id: string; date: string; weight: number; createdAt: any; }
interface MealData { id: string; date: string; mealType: string; calories: number | null; photoURL?: string; createdAt: any; }
interface WorkoutData { id: string; date: string; duration: number; notes: string; createdAt: any; }

const PERSONAL_USER_ID = "personal-user";   // 로그인 제거용 고정 ID

export default function VitalSyncDashboard() {
  const [weights, setWeights] = useState<WeightData[]>([]);
  const [meals, setMeals] = useState<MealData[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutData[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  const [newWeight, setNewWeight] = useState("");
  const [newDate, setNewDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const [mealType, setMealType] = useState("아침");
  const [mealCalories, setMealCalories] = useState("");
  const [mealPhoto, setMealPhoto] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // ==================== 테마 토글 ====================
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    if (newTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  };

  // ==================== 실시간 데이터 ====================
  useEffect(() => {
    const unsubWeights = onSnapshot(
      query(collection(db, "weights"), where("userId", "==", PERSONAL_USER_ID), orderBy("date", "asc")),
      (snap) => setWeights(snap.docs.map(d => ({ id: d.id, ...d.data() } as WeightData)))
    );
    const unsubMeals = onSnapshot(
      query(collection(db, "meals"), where("userId", "==", PERSONAL_USER_ID), orderBy("createdAt", "desc")),
      (snap) => setMeals(snap.docs.map(d => ({ id: d.id, ...d.data() } as MealData)))
    );
    const unsubWorkouts = onSnapshot(
      query(collection(db, "workouts"), where("userId", "==", PERSONAL_USER_ID), orderBy("date", "asc")),
      (snap) => setWorkouts(snap.docs.map(d => ({ id: d.id, ...d.data() } as WorkoutData)))
    );

    setLoading(false);
    return () => { unsubWeights(); unsubMeals(); unsubWorkouts(); };
  }, []);

  // ==================== 몸무게 기록 ====================
  const addWeight = async () => {
    if (!newWeight) {
      alert("몸무게를 입력해주세요.");
      return;
    }
    const weightNum = parseFloat(newWeight);
    try {
      const q = query(collection(db, "weights"), where("userId", "==", PERSONAL_USER_ID), where("date", "==", newDate));
      const snap = await getDocs(q);
      await Promise.all(snap.docs.map(d => deleteDoc(doc(db, "weights", d.id))));

      await addDoc(collection(db, "weights"), {
        userId: PERSONAL_USER_ID,
        date: newDate,
        weight: weightNum,
        createdAt: Timestamp.now(),
      });

      setNewWeight("");
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      alert("저장에 실패했습니다.");
    }
  };

  // ==================== 식사 기록 (사진 선택사항) ====================
  const addMeal = async () => {
    if (!mealType) return;

    setUploading(true);
    try {
      let photoURL = "";
      if (mealPhoto) {
        const storageRef = ref(storage, `meals/${PERSONAL_USER_ID}/${Date.now()}_${mealPhoto.name}`);
        await uploadBytes(storageRef, mealPhoto);
        photoURL = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, "meals"), {
        userId: PERSONAL_USER_ID,
        date: format(new Date(), "yyyy-MM-dd"),
        mealType,
        calories: mealCalories ? parseInt(mealCalories) : null,
        photoURL: photoURL || undefined,
        createdAt: Timestamp.now(),
      });

      setIsMealModalOpen(false);
      setMealPhoto(null);
      setMealCalories("");
      setMealType("아침");
    } catch (error) {
      console.error(error);
      alert("저장에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  // ==================== 운동 기록 ====================
  const saveWorkout = async (date: string, duration: number, notes: string) => {
    try {
      const q = query(collection(db, "workouts"), where("userId", "==", PERSONAL_USER_ID), where("date", "==", date));
      const snap = await getDocs(q);
      await Promise.all(snap.docs.map(d => deleteDoc(doc(db, "workouts", d.id))));

      await addDoc(collection(db, "workouts"), {
        userId: PERSONAL_USER_ID, date, duration, notes, createdAt: Timestamp.now()
      });
      alert("운동 기록이 저장되었습니다!");
      setIsCalendarModalOpen(false);
    } catch (error) {
      console.error(error);
      alert("저장에 실패했습니다.");
    }
  };

  // ==================== 계산 ====================
  const chartData = weights.map(item => ({ date: format(new Date(item.date), "MM/dd"), weight: item.weight }));
  const latestWeight = weights.length > 0 ? weights[weights.length - 1].weight : 0;
  const firstWeight = weights.length > 0 ? weights[0].weight : 0;
  const weightChange = weights.length > 0 ? (latestWeight - firstWeight).toFixed(1) : "0.0";

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getStatus = (dateStr: string) => ({
    hasMeal: meals.some(m => m.date === dateStr),
    hasWorkout: workouts.some(w => w.date === dateStr),
  });

  const getMealsForDate = (dateStr: string) => meals.filter(m => m.date === dateStr);
  const getWorkoutForDate = (dateStr: string) => workouts.find(w => w.date === dateStr);

  if (loading) return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-zinc-950 text-zinc-100" : "bg-zinc-50 text-zinc-900"}`}>

      {/* 헤더 */}
      <header className={`border-b ${theme === "dark" ? "border-zinc-800 bg-zinc-950/80" : "border-zinc-200 bg-white/80"} backdrop-blur-md sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">V</span>
            </div>
            <h1 className="font-semibold text-2xl tracking-tight">VitalSync</h1>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 px-5 py-2.5 rounded-2xl text-sm font-medium text-white active:scale-95">
              <Plus size={18} /> 몸무게
            </button>

            <button onClick={() => setIsMealModalOpen(true)} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 px-5 py-2.5 rounded-2xl text-sm font-medium text-white active:scale-95">
              <Plus size={18} /> 식사
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <p className="text-zinc-500 dark:text-zinc-400">안녕하세요, 그라비타님 👋</p>
          <h2 className="text-3xl font-semibold tracking-tight mt-1">오늘도 좋은 하루 되세요</h2>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className={`rounded-3xl p-6 ${theme === "dark" ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-200 shadow"}`}>
            <div className="flex items-center gap-3 text-emerald-500 mb-2">
              <TrendingDown className="w-5 h-5" />
              <span className="text-sm font-medium">현재 체중</span>
            </div>
            <div className="text-5xl font-semibold tracking-tighter">{latestWeight} kg</div>
            <p className="text-emerald-400 text-sm mt-1">최근 {weightChange}kg</p>
          </div>
          <div className={`rounded-3xl p-6 ${theme === "dark" ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-200 shadow"}`}>
            <div className="flex items-center gap-3 text-zinc-500 mb-2">
              <CalendarIcon className="w-5 h-5" />
              <span className="text-sm font-medium">기록일</span>
            </div>
            <div className="text-5xl font-semibold tracking-tighter">{weights.length}일</div>
          </div>
          <div className={`rounded-3xl p-6 ${theme === "dark" ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-200 shadow"} flex items-center justify-center`}>
            <div className="text-center">
              <p className="text-zinc-500 text-sm mb-1">다음 목표</p>
              <p className="text-3xl font-semibold">68.0 kg</p>
            </div>
          </div>
        </div>

        {/* 그래프 */}
        <div className={`rounded-3xl p-6 mb-8 ${theme === "dark" ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-200 shadow"}`}>
          <h3 className="font-semibold text-xl mb-4">체중 변화 추이</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#27272a" : "#e5e5e5"} />
                <XAxis dataKey="date" stroke={theme === "dark" ? "#52525b" : "#a3a3a3"} />
                <YAxis domain={["auto", "auto"]} stroke={theme === "dark" ? "#52525b" : "#a3a3a3"} />
                <Tooltip />
                <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={3} dot={{ fill: "#10b981", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 캘린더 */}
        <div className={`rounded-3xl p-6 ${theme === "dark" ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-200 shadow"}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-xl flex items-center gap-2">
              <CalendarIcon className="w-6 h-6" /> 캘린더
            </h3>
            <div className="flex items-center gap-2 text-sm">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl"><ChevronLeft /></button>
              <span className="font-medium w-44 text-center">{format(currentMonth, "yyyy년 MM월", { locale: ko })}</span>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl"><ChevronRight /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {["일", "월", "화", "수", "목", "금", "토"].map(d => <div key={d} className="font-medium text-zinc-500 py-2">{d}</div>)}
            {Array.from({ length: getDay(monthStart) }).map((_, i) => <div key={i} />)}
            {daysInMonth.map(day => {
              const dateStr = format(day, "yyyy-MM-dd");
              const status = getStatus(dateStr);
              return (
                <button
                  key={dateStr}
                  onClick={() => { setSelectedDate(dateStr); setIsCalendarModalOpen(true); }}
                  className={`h-14 flex flex-col items-center justify-center rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800 relative ${theme === "dark" ? "text-zinc-100" : "text-zinc-900"}`}
                >
                  <span>{format(day, "d")}</span>
                  <div className="flex gap-1 mt-1">
                    {status.hasMeal && <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />}
                    {status.hasWorkout && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 몸무게 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
          <div className={`rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md p-8 ${theme === "dark" ? "bg-zinc-900 border border-zinc-700" : "bg-white border border-zinc-200 shadow-xl"}`}>
            <h3 className="text-2xl font-semibold mb-6">몸무게 기록하기</h3>
            <div className="space-y-5">
              <div>
                <label className="text-sm text-zinc-500 mb-1.5 block">날짜</label>
                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-2xl px-4 py-3" />
              </div>
              <div>
                <label className="text-sm text-zinc-500 mb-1.5 block">체중 (kg)</label>
                <input type="number" step="0.1" value={newWeight} onChange={e => setNewWeight(e.target.value)} placeholder="70.5" className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-2xl px-4 py-3 text-3xl font-semibold" />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 rounded-3xl bg-zinc-200 dark:bg-zinc-800">취소</button>
              <button onClick={addWeight} disabled={!newWeight} className="flex-1 py-4 rounded-3xl bg-emerald-500 text-white disabled:opacity-50">기록하기</button>
            </div>
          </div>
        </div>
      )}

      {/* 식사 모달 */}
      {isMealModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-[60] p-4">
          <div className={`rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md p-8 ${theme === "dark" ? "bg-zinc-900 border border-zinc-700" : "bg-white border border-zinc-200 shadow-xl"}`}>
            <h3 className="text-2xl font-semibold mb-6">식사 기록하기</h3>
            <div className="space-y-5">
              <div>
                <label className="text-sm text-zinc-500 mb-1.5 block">식사 종류</label>
                <select value={mealType} onChange={e => setMealType(e.target.value)} className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-2xl px-4 py-3">
                  <option value="아침">아침</option>
                  <option value="점심">점심</option>
                  <option value="저녁">저녁</option>
                  <option value="간식">간식</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-zinc-500 mb-1.5 block">칼로리 (선택)</label>
                <input type="number" value={mealCalories} onChange={e => setMealCalories(e.target.value)} placeholder="650" className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-2xl px-4 py-3" />
              </div>
              <div>
                <label className="text-sm text-zinc-500 mb-1.5 block">식사 사진 (선택)</label>
                <input type="file" accept="image/*" onChange={e => setMealPhoto(e.target.files?.[0] || null)} className="w-full" />
                {mealPhoto && <p className="text-emerald-400 text-sm mt-2">{mealPhoto.name}</p>}
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsMealModalOpen(false)} className="flex-1 py-4 rounded-3xl bg-zinc-200 dark:bg-zinc-800">취소</button>
              <button onClick={addMeal} className="flex-1 py-4 rounded-3xl bg-emerald-500 text-white">기록하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
