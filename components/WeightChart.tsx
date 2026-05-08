"use client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend, Scatter, ComposedChart,
} from "recharts";
import { format } from "date-fns";
import type { WeightRecord, InbodyRecord } from "@/types";
import { movingAverage } from "@/lib/calculations";
import { Card } from "./SummaryCards";

interface Props {
  weights: WeightRecord[];
  inbodyRecords?: InbodyRecord[];
  targetWeight: number;
}

interface Point {
  date: string;
  dateLabel: string;
  weight: number | null;
  inbodyWeight: number | null;
  avg: number | null;
  source: string;
}

export default function WeightChart({ weights, inbodyRecords = [], targetWeight }: Props) {
  // ⭐ 체중 + 인바디를 통합 timeline으로 빌드
  // 같은 날짜에 둘 다 있으면 인바디 우선 (더 정확)
  const dateMap = new Map<string, { weight: number; source: "weight" | "inbody" }>();

  weights.forEach((w) => {
    dateMap.set(w.date, { weight: w.weight, source: "weight" });
  });
  inbodyRecords.forEach((r) => {
    if (r.weight && r.measuredAt) {
      // 인바디는 우선순위 높음 (덮어쓰기)
      dateMap.set(r.measuredAt, { weight: r.weight, source: "inbody" });
    }
  });

  const allPoints = Array.from(dateMap.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 7일 이동평균은 통합 데이터 기준
  const withAvg = movingAverage(
    allPoints.map((p) => ({ date: p.date, weight: p.weight })),
    7
  );

  const chartData: Point[] = allPoints.map((p, i) => ({
    date: p.date,
    dateLabel: format(new Date(p.date), "MM/dd"),
    // 체중기록 라인용 (인바디만 있는 날은 null로 끊지 않게 둘 다 같은 값)
    weight: p.source === "weight" ? p.weight : null,
    // 인바디 점만 따로 강조 (큰 점)
    inbodyWeight: p.source === "inbody" ? p.weight : null,
    avg: withAvg[i]?.avg ?? null,
    source: p.source,
  }));

  // 통합 라인 (모든 측정값 연결)
  const combinedData = allPoints.map((p, i) => ({
    dateLabel: format(new Date(p.date), "MM/dd"),
    combined: p.weight,
    inbodyWeight: p.source === "inbody" ? p.weight : null,
    avg: withAvg[i]?.avg ?? null,
  }));

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold tracking-tight">
          체중 변화 <span className="serif-italic text-[color:var(--muted)]">통합 추이</span>
        </h3>
        <div className="flex items-center gap-3 text-[11px] text-[color:var(--muted)]">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-0.5 bg-[var(--color-sage-500)]" />
            체중 기록
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-mauve-500)]" />
            인바디
          </span>
        </div>
      </div>

      {chartData.length === 0 ? (
        <p className="text-[color:var(--muted)] py-12 text-center text-sm">
          체중 또는 인바디를 기록하면 그래프가 표시됩니다
        </p>
      ) : (
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={combinedData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="currentColor" strokeOpacity={0.08} />
              <XAxis
                dataKey="dateLabel"
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
              <Legend wrapperStyle={{ fontSize: "11px" }} iconType="line" />
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
              {/* 통합 라인 */}
              <Line
                type="monotone"
                dataKey="combined"
                name="체중"
                stroke="var(--color-sage-500)"
                strokeWidth={2}
                dot={{ fill: "var(--color-sage-500)", r: 2.5, strokeWidth: 0 }}
                activeDot={{ r: 4, strokeWidth: 0 }}
                connectNulls
              />
              {/* 7일 평균 */}
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
              {/* 인바디 측정점만 강조 (큰 마우브 점) */}
              <Scatter
                name="인바디"
                dataKey="inbodyWeight"
                fill="var(--color-mauve-500)"
                shape={(props: { cx?: number; cy?: number }) => {
                  const cx = props.cx ?? 0;
                  const cy = props.cy ?? 0;
                  return (
                    <g>
                      <circle cx={cx} cy={cy} r={6} fill="var(--color-mauve-500)" fillOpacity={0.2} />
                      <circle cx={cx} cy={cy} r={3.5} fill="var(--color-mauve-500)" />
                    </g>
                  );
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
