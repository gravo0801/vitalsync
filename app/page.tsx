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
import { getAuth, onAuthStateChanged, signInAnonymously, User } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

// ==================== 타입 ====================
interface WeightData { id: string; userId: string; date: string; weight: number; createdAt: any; }
interface MealData { id: string; userId: string; date: string; mealType: string; calories: number | null; photoURL: string; createdAt: any; }
interface WorkoutData { id: string; userId: string; date: string; duration: number; notes: string; createdAt: any; }

export default function VitalSyncDashboard() {
  // ==================== 상태 ====================
  const [weights, setWeights] = useState<WeightData[]>([]);
  const [meals, setMeals] = useState<MealData[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutData[]>([]);
  const [user, setUser] = useState<User | null>(null);
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

  // ==================== 인증 ====================
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
      } else {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error(error);
          setLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // ==================== 실시간 데이터 ====================
  useEffect(() => {
    if (!user) return;
    const unsubWeights = onSnapshot(query(collection(db, "weights"), where("userId", "==", user.uid), orderBy("date", "asc")), (snap) => setWeights(snap.docs.map(d => ({ id: d.id, ...d.data() } as WeightData))));
    const unsubMeals = onSnapshot(query(collection(db, "meals"), where("userId", "==", user.uid), orderBy("createdAt", "desc")), (snap) => setMeals(snap.docs.map(d => ({ id: d.id, ...d.data() } as MealData))));
    const unsubWorkouts = onSnapshot(query(collection(db, "workouts"), where("userId", "==", user.uid), orderBy("date", "asc")), (snap) => setWorkouts(snap.docs.map(d => ({ id: d.id, ...d.data() } as WorkoutData))));
    return () => { unsubWeights(); unsubMeals(); unsubWorkouts(); };
  }, [user]);

  // ==================== 몸무게 기록 ====================
  const addWeight = async () => {
    if (!newWeight) {
      alert("몸무게를 입력해주세요.");
      return;
    }
    let currentUser = user;
    if (!currentUser) {
      const auth = getAuth();
      try {
        const result = await signInAnonymously(auth);
        currentUser = result.user;
        setUser(currentUser);
      } catch (e) {
        alert("로그인에 실패했습니다.");
        return;
      }
    }
    const weightNum = parseFloat(newWeight);
    try {
      const q = query(collection(db, "weights"), where("userId", "==", currentUser.uid), where("date", "==", newDate));
      const snap = await getDocs(q);
      await Promise.all(snap.docs.map(d => deleteDoc(doc(db, "weights", d.id))));
      await addDoc(collection(db, "weights"), {
        userId: currentUser.uid,
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

  // ==================== 식사 기록 ====================
  const addMeal = async () => {
    if (!user || !mealPhoto) {
      alert("사진을 선택해주세요!");
      return;
    }
    setUploading(true);
    try {
      const storageRef = ref(storage, `meals/${user.uid}/${Date.now()}_${mealPhoto.name}`);
      await uploadBytes(storageRef, mealPhoto);
      const photoURL = await getDownloadURL(storageRef);
      await addDoc(collection(db, "meals"), {
        userId: user.uid,
        date: format(new Date(), "yyyy-MM-dd"),
        mealType,
        calories: mealCalories ? parseInt(mealCalories) : null,
        photoURL,
        createdAt: Timestamp.now(),
      });
      setIsMealModalOpen(false);
      setMealPhoto(null);
      setMealCalories("");
      setMealType("아침");
    } catch (error) {
      console.error(error);
      alert("업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  // ==================== 운동 기록 저장 ====================
  const saveWorkout = async (date: string, duration: number, notes: string) => {
    if (!user) return;
    try {
      const q = query(collection(db, "workouts"), where("userId", "==", user.uid), where("date", "==", date));
      const snap = await getDocs(q);
      await Promise.all(snap.docs.map(d => deleteDoc(doc(db, "workouts", d.id))));
      await addDoc(collection(db, "workouts"), {
        userId: user.uid, date, duration, notes, createdAt: Timestamp.now()
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">로딩 중...</div>;

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-zinc-950 text-zinc-100" : "bg-zinc-100 text-zinc-900"}`}>

      {/* 헤더 */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">V</span>
            </div>
            <h1 className="font-semibold text-2xl tracking-tight">VitalSync</h1>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-zinc-800 transition-colors">
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 px-5 py-2.5 rounded-2xl text-sm font-medium active:scale-95">
              <Plus size={18} /> 몸무게
            </button>
            <button onClick={() => setIsMealModalOpen(true)} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 px-5 py-2.5 rounded-2xl text-sm font-medium active:scale-95">
              <Plus size={18} /> 식사
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <p className="text-zinc-400">안녕하세요, 그라비타님 👋</p>
          <h2 className="text-3xl font-semibold tracking-tight mt-1">오늘도 좋은 하루 되세요</h2>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <div className="flex items-center gap-3 text-emerald-400 mb-2">
              <TrendingDown className="w-5 h-5" />
              <span className="text-sm font-medium">현재 체중</span>
            </div>
            <div className="text-5xl font-semibold tracking-tighter">{latestWeight} kg</div>
            <p className="text-emerald-400 text-sm mt-1">최근 {weightChange}kg</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <div className="flex items-center gap-3 text-zinc-400 mb-2">
              <CalendarIcon className="w-5 h-5" />
              <span className="text-sm font-medium">기록일</span>
            </div>
            <div className="text-5xl font-semibold tracking-tighter">{weights.length}일</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex items-center justify-center">
            <div className="text-center">
              <p className="text-zinc-400 text-sm mb-1">다음 목표</p>
              <p className="text-3xl font-semibold">68.0 kg</p>
            </div>
          </div>
        </div>

        {/* 그래프 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-8">
          <h3 className="font-semibold text-xl mb-4">체중 변화 추이</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" stroke="#52525b" />
                <YAxis domain={["auto", "auto"]} stroke="#52525b" />
                <Tooltip />
                <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={3} dot={{ fill: "#10b981", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 최근 기록 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <h3 className="font-semibold mb-4">최근 체중 기록</h3>
            {weights.length === 0 ? <p className="text-zinc-400">기록이 없습니다.</p> : (
              <div className="space-y-2">
                {weights.slice().reverse().slice(0, 5).map((item, index) => (
                  <div key={index} className="flex justify-between items-center bg-zinc-950 px-4 py-3 rounded-2xl">
                    <span>{format(new Date(item.date), "yyyy년 MM월 dd일", { locale: ko })}</span>
                    <span className="font-mono font-semibold">{item.weight} kg</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <h3 className="font-semibold mb-4">최근 식사 기록</h3>
            {meals.length === 0 ? <p className="text-zinc-400">기록이 없습니다.</p> : (
              <div className="space-y-3">
                {meals.slice(0, 4).map((meal) => (
                  <div key={meal.id} className="flex gap-4 bg-zinc-950 rounded-2xl overflow-hidden">
                    {meal.photoURL && <img src={meal.photoURL} className="w-20 h-20 object-cover" />}
                    <div className="py-3">
                      <div className="font-semibold">{meal.mealType}</div>
                      {meal.calories && <div className="text-emerald-400 text-sm">{meal.calories} kcal</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 캘린더 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-xl flex items-center gap-2">
              <CalendarIcon className="w-6 h-6" /> 캘린더
            </h3>
            <div className="flex items-center gap-2 text-sm">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-zinc-800 rounded-xl"><ChevronLeft /></button>
              <span className="font-medium w-44 text-center">{format(currentMonth, "yyyy년 MM월", { locale: ko })}</span>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-zinc-800 rounded-xl"><ChevronRight /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {["일", "월", "화", "수", "목", "금", "토"].map(d => <div key={d} className="font-medium text-zinc-400 py-2">{d}</div>)}
            {Array.from({ length: getDay(monthStart) }).map((_, i) => <div key={i} />)}
            {daysInMonth.map(day => {
              const dateStr = format(day, "yyyy-MM-dd");
              const status = getStatus(dateStr);
              return (
                <button
                  key={dateStr}
                  onClick={() => { setSelectedDate(dateStr); setIsCalendarModalOpen(true); }}
                  className="h-14 flex flex-col items-center justify-center rounded-xl hover:bg-zinc-800 relative"
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
          <div className="bg-zinc-900 border border-zinc-700 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md p-8">
            <h3 className="text-2xl font-semibold mb-6">몸무게 기록하기</h3>
            <div className="space-y-5">
              <div>
                <label className="text-sm text-zinc-400 mb-1.5 block">날짜</label>
                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-4 py-3" />
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1.5 block">체중 (kg)</label>
                <input type="number" step="0.1" value={newWeight} onChange={e => setNewWeight(e.target.value)} placeholder="70.5" className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-4 py-3 text-3xl font-semibold" />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 rounded-3xl bg-zinc-800">취소</button>
              <button onClick={addWeight} disabled={!newWeight} className="flex-1 py-4 rounded-3xl bg-emerald-500 disabled:opacity-50">기록하기</button>
            </div>
          </div>
        </div>
      )}

      {/* 식사 모달 */}
      {isMealModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-[60] p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md p-8">
            <h3 className="text-2xl font-semibold mb-6">식사 사진 기록하기</h3>
            <div className="space-y-5">
              <div>
                <label className="text-sm text-zinc-400 mb-1.5 block">식사 종류</label>
                <select value={mealType} onChange={e => setMealType(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-4 py-3">
                  <option value="아침">아침</option><option value="점심">점심</option><option value="저녁">저녁</option><option value="간식">간식</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1.5 block">칼로리 (선택)</label>
                <input type="number" value={mealCalories} onChange={e => setMealCalories(e.target.value)} placeholder="650" className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-4 py-3" />
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1.5 block">식사 사진</label>
                <input type="file" accept="image/*" onChange={e => setMealPhoto(e.target.files?.[0] || null)} className="w-full" />
                {mealPhoto && <p className="text-emerald-400 text-sm mt-2">{mealPhoto.name}</p>}
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsMealModalOpen(false)} className="flex-1 py-4 rounded-3xl bg-zinc-800">취소</button>
              <button onClick={addMeal} disabled={!mealPhoto || uploading} className="flex-1 py-4 rounded-3xl bg-emerald-500 disabled:opacity-50">{uploading ? "업로드 중..." : "식사 기록하기"}</button>
            </div>
          </div>
        </div>
      )}

      {/* 캘린더 모달 */}
      {isCalendarModalOpen && selectedDate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70] p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl w-full max-w-lg p-8">
            <h3 className="text-2xl font-semibold mb-6">{format(new Date(selectedDate), "yyyy년 MM월 dd일", { locale: ko })}</h3>
            <div className="mb-8">
              <h4 className="font-semibold mb-3">식사 내역</h4>
              {getMealsForDate(selectedDate).length > 0 ? getMealsForDate(selectedDate).map(meal => (
                <div key={meal.id} className="flex gap-4 mb-3 bg-zinc-950 p-3 rounded-2xl">
                  {meal.photoURL && <img src={meal.photoURL} className="w-16 h-16 rounded-xl object-cover" />}
                  <div><div className="font-medium">{meal.mealType}</div>{meal.calories && <div className="text-emerald-400 text-sm">{meal.calories} kcal</div>}</div>
                </div>
              )) : <p className="text-zinc-400">식사 기록이 없습니다.</p>}
            </div>
            <div>
              <h4 className="font-semibold mb-3">운동 기록</h4>
              {getWorkoutForDate(selectedDate) ? (
                <div className="bg-zinc-950 p-4 rounded-2xl mb-4">
                  <p>운동 시간: <span className="font-semibold">{getWorkoutForDate(selectedDate)?.duration}분</span></p>
                  <p className="mt-2 text-sm">메모: {getWorkoutForDate(selectedDate)?.notes || "없음"}</p>
                </div>
              ) : <p className="text-zinc-400 mb-4">운동 기록이 없습니다.</p>}
              <WorkoutForm date={selectedDate} existingWorkout={getWorkoutForDate(selectedDate)} onSave={saveWorkout} />
            </div>
            <button onClick={() => setIsCalendarModalOpen(false)} className="mt-8 w-full py-4 bg-zinc-800 rounded-3xl hover:bg-zinc-700">닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== 운동 기록 폼 ====================
function WorkoutForm({ date, existingWorkout, onSave }: { 
  date: string; 
  existingWorkout?: WorkoutData; 
  onSave: (date: string, duration: number, notes: string) => void 
}) {
  const [duration, setDuration] = useState(existingWorkout?.duration || 60);
  const [notes, setNotes] = useState(existingWorkout?.notes || "");

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-zinc-400">운동 시간 (분)</label>
        <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-4 py-3 mt-1" />
      </div>
      <div>
        <label className="text-sm text-zinc-400">메모</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-4 py-3 mt-1 h-24" placeholder="오늘 운동 내용..." />
      </div>
      <button onClick={() => onSave(date, duration, notes)} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 rounded-3xl font-medium">
        {existingWorkout ? "운동 기록 수정하기" : "운동 기록 저장하기"}
      </button>
    </div>
  );
}
