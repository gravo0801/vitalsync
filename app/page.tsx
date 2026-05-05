"use client";

import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Plus, TrendingDown, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

// 임시 데이터
const initialWeights = [
  { date: "2026-04-20", weight: 72.5 },
  { date: "2026-04-22", weight: 72.1 },
  { date: "2026-04-25", weight: 71.8 },
  { date: "2026-04-28", weight: 71.3 },
  { date: "2026-05-01", weight: 70.9 },
  { date: "2026-05-03", weight: 70.5 },
];

export default function VitalSyncDashboard() {
  const [weights, setWeights] = useState(initialWeights);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [newDate, setNewDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const chartData = weights
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((item) => ({
      date: format(new Date(item.date), "MM/dd"),
      weight: item.weight,
    }));

  const addWeight = () => {
    if (!newWeight) return;
    const weightNum = parseFloat(newWeight);
    const newEntry = { date: newDate, weight: weightNum };

    const filtered = weights.filter((w) => w.date !== newDate);
    const updated = [...filtered, newEntry].sort((a, b) => a.date.localeCompare(b.date));

    setWeights(updated);
    setNewWeight("");
    setIsModalOpen(false);
  };

  const latestWeight = weights[weights.length - 1]?.weight || 0;
  const firstWeight = weights[0]?.weight || 0;
  const weightChange = (latestWeight - firstWeight).toFixed(1);

  return (
    <div className="min-h-screen bg-zinc-950 pb-8">
      {/* 헤더 - 모바일 최적화 */}
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
              <span className="hidden sm:inline">동기화됨</span>
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

        {/* 요약 카드 - 모바일에서 더 크게 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* 카드 1,2,3 동일 */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <div className="flex items-center gap-3 text-emerald-400 mb-2">
              <TrendingDown className="w-5 h-5" />
              <span className="text-sm font-medium">현재 체중</span>
            </div>
            <div className="text-5xl font-semibold tracking-tighter">{latestWeight} <span className="text-2xl text-zinc-400">kg</span></div>
            <p className="text-emerald-400 text-sm mt-1">최근 {weightChange}kg 변화</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <div className="flex items-center gap-3 text-zinc-400 mb-2">
              <Calendar className="w-5 h-5" />
              <span className="text-sm font-medium">기록일</span>
            </div>
            <div className="text-5xl font-semibold tracking-tighter">{weights.length}일</div>
            <p className="text-zinc-400 text-sm mt-1">연속 기록 중</p>
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
              <p className="text-zinc-400 text-sm">최근 기록 기준</p>
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
                <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={3} dot={{ fill: "#10b981", r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 최근 기록 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6">
          <h3 className="font-semibold mb-4 px-2">최근 체중 기록</h3>
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
        </div>
      </div>

      {/* 모달 - 모바일 최적화 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-t-3xl sm:rounded-3xl w-full sm:w-full max-w-md p-8 max-h-[90vh] overflow-auto">
            <h3 className="text-2xl font-semibold mb-6">몸무게 기록하기</h3>
            {/* 나머지 모달 내용은 이전과 동일 */}
            <div className="space-y-5">
              <div>
                <label className="text-sm text-zinc-400 mb-1.5 block">날짜</label>
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1.5 block">체중 (kg)</label>
                <input type="number" step="0.1" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} placeholder="70.5" className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-4 py-3 text-3xl font-semibold focus:outline-none focus:border-emerald-500" />
              </div>
            </div>

            <div className="flex gap-3 mt-10">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 rounded-3xl bg-zinc-800 hover:bg-zinc-700 text-base font-medium">취소</button>
              <button onClick={addWeight} disabled={!newWeight} className="flex-1 py-4 rounded-3xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-base font-medium">기록하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
