"use client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend,
} from "recharts";
import { format } from "date-fns";
import type { WeightRecord } from "@/types";
import { movingAverage } from "@/lib/calculations";
import { Card } from "./SummaryCards";

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
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold tracking-tight">
          체중 변화 <span className="serif-italic text-[color:var(--muted)]">추이</span>
        </h3>
        <span className="text-[11px] text-[color:var(--muted)]">
          파선: 7일 평균 · 빨간선: 목표
        </span>
      </div>
      {chartData.length === 0 ? (
        <p className="text-[color:var(--muted)] py-12 text-center text-sm">
          체중을 기록하면 그래프가 표시됩니다
        </p>
      ) : (
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="currentColor" strokeOpacity={0.08} />
              <XAxis
                dataKey="date"
                stroke="currentColor"
                strokeOpacity={0.4}
                fontSize={11}
                tick={{ fill: "currentColor", opacity: 0.6 }}
              />
              <YAxis
                domain={["auto", "auto"]}
                stroke="currentColor"
                strokeOpacity={0.4}
                fontSize={11}
                tick={{ fill: "currentColor", opacity: 0.6 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--card-border)",
                  borderRadius: "10px",
                  color: "var(--foreground)",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "var(--muted)" }}
              />
              <Legend
                wrapperStyle={{ fontSize: "11px", color: "var(--muted)" }}
                iconType="line"
              />
              <ReferenceLine
                y={targetWeight}
                stroke="var(--color-wine-500)"
                strokeDasharray="4 4"
                strokeOpacity={0.7}
                label={{
                  value: `목표 ${targetWeight}kg`,
                  fill: "var(--color-wine-600)",
                  fontSize: 10,
                  position: "right",
                }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                name="체중"
                stroke="var(--color-sage-500)"
                strokeWidth={2}
                dot={{ fill: "var(--color-sage-500)", r: 2.5, strokeWidth: 0 }}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="avg"
                name="7일 평균"
                stroke="var(--color-slate-blue-500)"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
