"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Plus, TrendingDown, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from "date-fns";
import { ko } from "date-fns/locale";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged, signInAnonymously, User } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

// ==================== 타입 ====================
interface WeightData {
  id: string;
  userId: string;
  date: string;
  weight: number;
  createdAt: any;
}

interface MealData {
  id: string;
  userId: string;
  date: string;
  mealType: string;
  calories: number | null;
  photoURL: string;
  createdAt: any;
}

interface WorkoutData {
  id: string;
  userId: string;
  date: string;
  duration: number;
  notes: string;
  createdAt: any;
}

export default function VitalSyncDashboard() {
  // ==================== 상태 ====================
  const [weights, setWeights] = useState<WeightData[]>([]);
  const [meals, setMeals] = useState<MealData[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutData[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 몸무게 모달
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [newDate, setNewDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // 식사 모달
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [mealType, setMealType] = useState("아침");
  const [mealCalories, setMealCalories] = useState("");
  const [mealPhoto, setMealPhoto] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // 캘린더 관련
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

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
          console.error("Anonymous sign-in failed:", error);
          setLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // ==================== 실시간 데이터 구독 ====================
  useEffect(() => {
    if (!user) return;

    // Weights
    const weightQuery = query(
      collection(db, "weights"),
      where("userId", "==", user.uid),
      orderBy("date", "asc")
    );
    const unsubWeights = onSnapshot(weightQuery, (snapshot) => {
      const data: WeightData[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<WeightData, "id">),
      }));
      setWeights(data);
    });

    // Meals
    const mealQuery = query(
      collection(db, "meals"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsubMeals = onSnapshot(mealQuery, (snapshot) => {
      const data: MealData[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<MealData, "id">),
      }));
      setMeals(data);
    });

    // Workouts
    const workoutQuery = query(
      collection(db, "workouts"),
      where("userId", "==", user.uid),
      orderBy("date", "asc")
    );
    const unsubWorkouts = onSnapshot(workoutQuery, (snapshot) => {
      const data: WorkoutData[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<WorkoutData, "id">),
      }));
      setWorkouts(data);
    });

    return () => {
      unsubWeights();
      unsubMeals();
      unsubWorkouts();
    };
  }, [user]);

  // ==================== 몸무게 추가 ====================
  const addWeight = async () => {
    if (!newWeight || !user) return;
    const weightNum = parseFloat(newWeight);

    try {
      const q = query(
        collection(db, "weights"),
        where("userId", "==", user.uid),
        where("date", "==", newDate)
      );
      const snapshot = await getDocs(q);
      await Promise.all(snapshot.docs.map(d => deleteDoc(doc(db, "weights", d.id))));

      await addDoc(collection(db, "weights"), {
        userId: user.uid,
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

  // ==================== 식사 업로드 ====================
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
      alert("업로드 실패");
    } finally {
      setUploading(false);
    }
  };

  // ==================== 운동 기록 저장 ====================
  const saveWorkout = async (date: string, duration: number, notes: string) => {
    if (!user) return;

    try {
      // 같은 날짜 운동 삭제 후 새로 저장
      const q = query(
        collection(db, "workouts"),
        where("userId", "==", user.uid),
        where("date", "==", date)
      );
      const snapshot = await getDocs(q);
      await Promise.all(snapshot.docs.map(d => deleteDoc(doc(db, "workouts", d.id))));

      await addDoc(collection(db, "workouts"), {
        userId: user.uid,
        date,
        duration,
        notes,
        createdAt: Timestamp.now(),
      });

      alert("운동 기록이 저장되었습니다!");
      setIsCalendarModalOpen(false);
    } catch (error) {
      console.error(error);
      alert("저장에 실패했습니다.");
    }
  };

  // ==================== 계산 및 헬퍼 ====================
  const chartData = weights.map((item) => ({
    date: format(new Date(item.date), "MM/dd"),
    weight: item.weight,
  }));

  const latestWeight = weights.length > 0 ? weights[weights.length - 1].weight : 0;
  const firstWeight = weights.length > 0 ? weights[0].weight : 0;
  const weightChange = weights.length > 0 ? (latestWeight - firstWeight).toFixed(1) : "0.0";

  // 캘린더 헬퍼
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const hasMealsOnDate = (dateStr: string) => meals.some(m => m.date === dateStr);
  const hasWorkoutOnDate = (dateStr: string) => workouts.some(w => w.date === dateStr);

  const getMealsForDate = (dateStr: string) => meals.filter(m => m.date === dateStr);
  const getWorkoutForDate = (dateStr: string) => workouts.find(w => w.date === dateStr);

  // ==================== 렌더링 ====================
  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">로딩 중...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-8">
      {/* 헤더 */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-emerald-500 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">V</span>
            </div>
            <div>
              <h1 className="font-semibold text-2xl tracking-tight">VitalSync</h1>
              <p className="text-[10px] text-zinc-500 -mt-1 hidden sm:block">BODY • MEAL • PROGRESS</p>
            </div>
          </div>
          <div className="px-3 py-1.5 bg-zinc-900 rounded-full text-sm flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Firebase 동기화됨
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* 상단 요약 + 버튼들 */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-zinc-400 text-sm">안녕하세요, 그라비타님 👋</p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-1">오늘도 좋은 하루 되세요</h2>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setIsModalOpen(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-3xl flex items-center gap-2">
              <Plus className="w-5 h-5" /> 몸무게
            </button>
            <button onClick={() => setIsMealModalOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-3xl flex items-center gap-2">
              <Plus className="w-5 h-5" /> 식사
            </button>
          </div>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-8 mb-8">
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

        {/* 최근 기록들 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 체중 기록 */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <h3 className="font-semibold mb-4">최근 체중 기록</h3>
            {weights.length === 0 ? <p className="text-zinc-400">기록이 없습니다.</p> : (
              <div className="space-y-2">
                {weights.slice().reverse().slice(0, 5).map((item, i) => (
                  <div key={i} className="flex justify-between bg-zinc-950 px-4 py-3 rounded-2xl">
                    <span>{format(new Date(item.date), "yyyy년 MM월 dd일", { locale: ko })}</span>
                    <span className="font-mono font-semibold">{item.weight} kg</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 식사 기록 */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <h3 className="font-semibold mb-4">최근 식사 기록</h3>
            {meals.length === 0 ? <p className="text-zinc-400">기록이 없습니다.</p> : (
              <div className="grid grid-cols-1 gap-3">
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

        {/* ==================== 캘린더 섹션 ==================== */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-xl flex items-center gap-2">
              <CalendarIcon className="w-6 h-6" /> 캘린더
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-zinc-800 rounded-xl">
                <ChevronLeft />
              </button>
              <span className="font-medium w-40 text-center">
                {format(currentMonth, "yyyy년 MM월", { locale: ko })}
              </span>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-zinc-800 rounded-xl">
                <ChevronRight />
              </button>
            </div>
          </div>

          {/* 캘린더 그리드 */}
          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {["일", "월", "화", "수", "목", "금", "토"].map(d => (
              <div key={d} className="font-medium text-zinc-400 py-2">{d}</div>
            ))}

            {Array.from({ length: getDay(monthStart) }).map((_, i) => (
              <div key={i} className="h-14" />
            ))}

            {daysInMonth.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const hasMeal = hasMealsOnDate(dateStr);
              const hasWorkout = hasWorkoutOnDate(dateStr);

              return (
                <button
                  key={dateStr}
                  onClick={() => {
                    setSelectedDate(dateStr);
                    setIsCalendarModalOpen(true);
                  }}
                  className="h-14 flex flex-col items-center justify-center rounded-xl hover:bg-zinc-800 relative"
                >
                  <span>{format(day, "d")}</span>
                  <div className="flex gap-1 mt-1">
                    {hasMeal && <div className="w-2 h-2 bg-orange-500 rounded-full" />}
                    {hasWorkout && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ==================== 모달들 ==================== */}
      {/* 몸무게 모달 (생략 - 이전과 동일) */}
      {/* 식사 모달 (생략 - 이전과 동일) */}

      {/* ==================== 캘린더 상세 모달 ==================== */}
      {isCalendarModalOpen && selectedDate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70] p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl w-full max-w-lg p-8">
            <h3 className="text-2xl font-semibold mb-6">{format(new Date(selectedDate), "yyyy년 MM월 dd일", { locale: ko })}</h3>

            {/* 식사 내역 */}
            <div className="mb-8">
              <h4 className="font-semibold mb-3">식사 내역</h4>
              {getMealsForDate(selectedDate).length > 0 ? (
                getMealsForDate(selectedDate).map((meal) => (
                  <div key={meal.id} className="flex gap-4 mb-3 bg-zinc-950 p-3 rounded-2xl">
                    {meal.photoURL && <img src={meal.photoURL} className="w-16 h-16 rounded-xl object-cover" />}
                    <div>
                      <div className="font-medium">{meal.mealType}</div>
                      {meal.calories && <div className="text-emerald-400 text-sm">{meal.calories} kcal</div>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-zinc-400">해당 날짜 식사 기록이 없습니다.</p>
              )}
            </div>

            {/* 운동 기록 */}
            <div>
              <h4 className="font-semibold mb-3">운동 기록</h4>
              {getWorkoutForDate(selectedDate) ? (
                <div className="bg-zinc-950 p-4 rounded-2xl">
                  <p>운동 시간: <span className="font-semibold">{getWorkoutForDate(selectedDate)?.duration}분</span></p>
                  <p className="mt-2 text-sm text-zinc-300">메모: {getWorkoutForDate(selectedDate)?.notes || "없음"}</p>
                </div>
              ) : (
                <p className="text-zinc-400 mb-4">운동 기록이 없습니다.</p>
              )}

              {/* 운동 기록 입력 폼 */}
              <WorkoutForm 
                date={selectedDate} 
                existingWorkout={getWorkoutForDate(selectedDate)}
                onSave={saveWorkout} 
              />
            </div>

            <button 
              onClick={() => setIsCalendarModalOpen(false)} 
              className="mt-8 w-full py-4 bg-zinc-800 rounded-3xl hover:bg-zinc-700"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== 운동 기록 폼 컴포넌트 ====================
function WorkoutForm({ date, existingWorkout, onSave }: { 
  date: string; 
  existingWorkout?: WorkoutData; 
  onSave: (date: string, duration: number, notes: string) => void 
}) {
  const [duration, setDuration] = useState(existingWorkout?.duration || 60);
  const [notes, setNotes] = useState(existingWorkout?.notes || "");

  return (
    <div className="mt-4 space-y-4">
      <div>
        <label className="text-sm text-zinc-400">운동 시간 (분)</label>
        <input 
          type="number" 
          value={duration} 
          onChange={(e) => setDuration(Number(e.target.value))} 
          className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-4 py-3 mt-1" 
        />
      </div>
      <div>
        <label className="text-sm text-zinc-400">메모</label>
        <textarea 
          value={notes} 
          onChange={(e) => setNotes(e.target.value)} 
          className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-4 py-3 mt-1 h-24" 
          placeholder="오늘 운동 내용..."
        />
      </div>
      <button 
        onClick={() => onSave(date, duration, notes)} 
        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 rounded-3xl font-medium"
      >
        {existingWorkout ? "운동 기록 수정하기" : "운동 기록 저장하기"}
      </button>
    </div>
  );
}
