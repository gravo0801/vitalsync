"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Plus, TrendingDown, Calendar } from "lucide-react";
import { format } from "date-fns";
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

// ==================== 타입 정의 ====================
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

export default function VitalSyncDashboard() {
  // ==================== 상태 ====================
  const [weights, setWeights] = useState<WeightData[]>([]);
  const [meals, setMeals] = useState<MealData[]>([]);
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

  // ==================== 익명 인증 ====================
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

  // ==================== 몸무게 실시간 구독 ====================
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "weights"),
      where("userId", "==", user.uid),
      orderBy("date", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: WeightData[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<WeightData, "id">),
      }));
      setWeights(data);
    });

    return () => unsubscribe();
  }, [user]);

  // ==================== 식사 실시간 구독 ====================
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "meals"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: MealData[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<MealData, "id">),
      }));
      setMeals(data);
    });

    return () => unsubscribe();
  }, [user]);

  // ==================== 몸무게 추가 ====================
  const addWeight = async () => {
    if (!newWeight || !user) return;

    const weightNum = parseFloat(newWeight);

    try {
      // 같은 날짜 데이터 삭제 (덮어쓰기)
      const q = query(
        collection(db, "weights"),
        where("userId", "==", user.uid),
        where("date", "==", newDate)
      );
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map((d) =>
        deleteDoc(doc(db, "weights", d.id))
      );
      await Promise.all(deletePromises);

      await addDoc(collection(db, "weights"), {
        userId: user.uid,
        date: newDate,
        weight: weightNum,
        createdAt: Timestamp.now(),
      });

      setNewWeight("");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding weight:", error);
      alert("저장에 실패했습니다.");
    }
  };

  // ==================== 식사 사진 업로드 ====================
  const addMeal = async () => {
    if (!user || !mealPhoto) {
      alert("사진을 선택해주세요!");
      return;
    }

    setUploading(true);

    try {
      // 1. Firebase Storage에 사진 업로드
      const storageRef = ref(storage, `meals/${user.uid}/${Date.now()}_${mealPhoto.name}`);
      await uploadBytes(storageRef, mealPhoto);
      const photoURL = await getDownloadURL(storageRef);

      // 2. Firestore에 저장
      await addDoc(collection(db, "meals"), {
        userId: user.uid,
        date: format(new Date(), "yyyy-MM-dd"),
        mealType: mealType,
        calories: mealCalories ? parseInt(mealCalories) : null,
        photoURL: photoURL,
        createdAt: Timestamp.now(),
      });

      // 초기화
      setIsMealModalOpen(false);
      setMealPhoto(null);
      setMealCalories("");
      setMealType("아침");
    } catch (error) {
      console.error("식사 저장 실패:", error);
      alert("업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  // ==================== 계산 값 ====================
  const chartData = weights.map((item) => ({
    date: format(new Date(item.date), "MM/dd"),
    weight: item.weight,
  }));

  const latestWeight = weights.length > 0 ? weights[weights.length - 1].weight : 0;
  const firstWeight = weights.length > 0 ? weights[0].weight : 0;
  const weightChange = weights.length > 0 ? (latestWeight - firstWeight).toFixed(1) : "0.0";

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white text-xl">
        로딩 중...
      </div>
    );
  }

  // ==================== 렌더링 ====================
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

          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <div className="px-3 py-1.5 bg-zinc-900 rounded-full flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="hidden sm:inline">Firebase 동기화됨</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* 상단 요약 */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-zinc-400 text-sm">안녕하세요, 그라비타님 👋</p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-1">오늘도 좋은 하루 되세요</h2>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all text-white px-6 py-3.5 rounded-3xl font-medium text-base sm:text-sm w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            몸무게 기록
          </button>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <div className="flex items-center gap-3 text-emerald-400 mb-2">
              <TrendingDown className="w-5 h-5" />
              <span className="text-sm font-medium">현재 체중</span>
            </div>
            <div className="text-5xl font-semibold tracking-tighter">
              {latestWeight} <span className="text-2xl text-zinc-400">kg</span>
            </div>
            <p className="text-emerald-400 text-sm mt-1">최근 {weightChange}kg 변화</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <div className="flex items-center gap-3 text-zinc-400 mb-2">
              <Calendar className="w-5 h-5" />
              <span className="text-sm font-medium">기록일</span>
            </div>
            <div className="text-5xl font-semibold tracking-tighter">{weights.length}일</div>
            <p className="text-zinc-400 text-sm mt-1">Firebase 저장됨</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex items-center justify-center">
            <div className="text-center">
              <p className="text-zinc-400 text-sm mb-1">다음 목표</p>
              <p className="text-3xl font-semibold">68.0 kg</p>
              <p className="text-xs text-emerald-400 mt-1">D-12</p>
            </div>
          </div>
        </div>

        {/* 그래프 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-xl">체중 변화 추이</h3>
              <p className="text-zinc-400 text-sm">Firebase 실시간 동기화</p>
            </div>
            <div className="text-emerald-400 text-sm font-medium">↓ {weightChange}kg</div>
          </div>

          <div className="h-[260px] sm:h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" stroke="#52525b" />
                <YAxis domain={["auto", "auto"]} stroke="#52525b" />
                <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "none", borderRadius: "12px" }} />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: "#10b981", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 최근 체중 기록 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6">
          <h3 className="font-semibold mb-4 px-2">최근 체중 기록</h3>
          {weights.length === 0 ? (
            <p className="text-zinc-400 px-4 py-8 text-center">아직 기록이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {weights.slice().reverse().slice(0, 5).map((item, index) => (
                <div key={index} className="flex justify-between items-center px-4 py-4 bg-zinc-950 rounded-2xl">
                  <div className="text-zinc-300 text-sm sm:text-base">
                    {format(new Date(item.date), "yyyy년 MM월 dd일 (EEE)", { locale: ko })}
                  </div>
                  <div className="font-mono text-xl font-semibold text-white">{item.weight} kg</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ==================== 식사 기록 섹션 ==================== */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 mt-8">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-semibold text-xl">식사 기록</h3>
            <button
              onClick={() => setIsMealModalOpen(true)}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-2xl text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> 식사 사진 기록
            </button>
          </div>

          {meals.length === 0 ? (
            <p className="text-zinc-400 px-4 py-8 text-center">아직 식사 기록이 없습니다.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {meals.slice(0, 6).map((meal) => (
                <div key={meal.id} className="bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800">
                  {meal.photoURL && (
                    <img 
                      src={meal.photoURL} 
                      alt={meal.mealType}
                      className="w-full h-44 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-lg">{meal.mealType}</span>
                      {meal.calories && (
                        <span className="text-emerald-400 font-medium">{meal.calories} kcal</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      {format(meal.createdAt?.toDate?.() || new Date(), "MM/dd HH:mm")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ==================== 몸무게 입력 모달 ==================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md p-8 max-h-[90vh] overflow-auto">
            <h3 className="text-2xl font-semibold mb-6">몸무게 기록하기</h3>
            
            <div className="space-y-5">
              <div>
                <label className="text-sm text-zinc-400 mb-1.5 block">날짜</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-sm text-zinc-400 mb-1.5 block">체중 (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  placeholder="70.5"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-4 py-3 text-3xl font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-10">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-4 rounded-3xl bg-zinc-800 hover:bg-zinc-700 text-base font-medium"
              >
                취소
              </button>
              <button
                onClick={addWeight}
                disabled={!newWeight}
                className="flex-1 py-4 rounded-3xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-base font-medium"
              >
                기록하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 식사 업로드 모달 ==================== */}
      {isMealModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md p-8 max-h-[90vh] overflow-auto">
            <h3 className="text-2xl font-semibold mb-6">식사 사진 기록하기</h3>

            <div className="space-y-5">
              {/* 식사 종류 */}
              <div>
                <label className="text-sm text-zinc-400 mb-1.5 block">식사 종류</label>
                <select 
                  value={mealType} 
                  onChange={(e) => setMealType(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="아침">아침</option>
                  <option value="점심">점심</option>
                  <option value="저녁">저녁</option>
                  <option value="간식">간식</option>
                </select>
              </div>

              {/* 칼로리 */}
              <div>
                <label className="text-sm text-zinc-400 mb-1.5 block">칼로리 (선택)</label>
                <input
                  type="number"
                  value={mealCalories}
                  onChange={(e) => setMealCalories(e.target.value)}
                  placeholder="예: 650"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* 사진 업로드 */}
              <div>
                <label className="text-sm text-zinc-400 mb-1.5 block">식사 사진</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setMealPhoto(e.target.files?.[0] || null)}
                  className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-2xl file:border-0 file:bg-emerald-600 file:text-white hover:file:bg-emerald-700"
                />
                {mealPhoto && (
                  <p className="text-emerald-400 text-sm mt-2">선택된 파일: {mealPhoto.name}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-10">
              <button
                onClick={() => {
                  setIsMealModalOpen(false);
                  setMealPhoto(null);
                }}
                className="flex-1 py-4 rounded-3xl bg-zinc-800 hover:bg-zinc-700 text-base font-medium"
                disabled={uploading}
              >
                취소
              </button>
              <button
                onClick={addMeal}
                disabled={!mealPhoto || uploading}
                className="flex-1 py-4 rounded-3xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-base font-medium"
              >
                {uploading ? "업로드 중..." : "식사 기록하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
