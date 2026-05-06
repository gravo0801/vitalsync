"use client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend,
} from "recharts";
import { format } from "date-fns";
import type { WeightRecord } from "@/types";
import { movingAverage } from "@/lib/calculations";

interface Props {
  weights: WeightRecord[];
  targetWeight: number;
}

export default function WeightChart({ weights, targetWeight }: Props) {
  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  const withAvg = movingAverage(
    sorted.map((w) => ({ date: w.date, weight: w.weight })),
    7
  );

  const chartData = withAvg.map((item) => ({
    date: format(new Date(item.date), "MM/dd"),
    weight: item.weight,
    avg: item.avg,
  }));

  return (
    <div className="rounded-3xl p-6 mb-6 bg-white dark:bg-zinc-900 border border-amber-200 dark:border-zinc-800 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-xl">체중 변화 추이</h3>
        <span className="text-xs text-stone-500 dark:text-zinc-400">
          파선: 7일 이동평균 · 빨간선: 목표
        </span>
      </div>
      {chartData.length === 0 ? (
        <p className="text-stone-500 dark:text-zinc-400 py-12 text-center">
          체중을 기록하면 그래프가 표시됩니다
        </p>
      ) : (
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
              <XAxis dataKey="date" stroke="currentColor" strokeOpacity={0.5} fontSize={12} />
              <YAxis domain={["auto", "auto"]} stroke="currentColor" strokeOpacity={0.5} fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255,255,255,0.95)",
                  border: "1px solid #e5e5e5",
                  borderRadius: "12px",
                  color: "#1c1917",
                }}
              />
              <Legend />
              <ReferenceLine
                y={targetWeight}
                stroke="#ef4444"
                strokeDasharray="5 5"
                label={{ value: `목표 ${targetWeight}kg`, fill: "#ef4444", fontSize: 11, position: "right" }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                name="체중"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: "#10b981", r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="avg"
                name="7일 평균"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
