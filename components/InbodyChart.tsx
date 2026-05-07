"use client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { format } from "date-fns";
import type { InbodyRecord } from "@/types";
import { Card } from "./SummaryCards";

interface Props {
  records: InbodyRecord[];
}

export default function InbodyChart({ records }: Props) {
  const chartData = records
    .filter((r) => r.measuredAt)
    .map((r) => ({
      date: format(new Date(r.measuredAt), "yy.MM.dd"),
      체중: r.weight ?? null,
      골격근량: r.skeletalMuscleMass ?? null,
      체지방량: r.bodyFatMass ?? null,
      체지방률: r.bodyFatPercent ?? null,
    }));

  if (chartData.length === 0) {
    return null;
  }

  return (
    <Card className="mb-5">
      <h3 className="text-base font-semibold tracking-tight mb-1">
        체성분 <span className="serif-italic">변화 추이</span>
      </h3>
      <p className="text-xs text-[color:var(--muted)] mb-4">
        측정일별 누적 데이터
      </p>

      {/* 체중·골격근량·체지방량 (kg) */}
      <div className="mb-5">
        <div className="text-xs text-[color:var(--muted-foreground)] font-medium mb-2">
          질량 (kg)
        </div>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="currentColor" strokeOpacity={0.08} />
              <XAxis dataKey="date" stroke="currentColor" strokeOpacity={0.4} fontSize={11}
                tick={{ fill: "currentColor", opacity: 0.6 }} />
              <YAxis domain={["auto", "auto"]} stroke="currentColor" strokeOpacity={0.4} fontSize={11}
                tick={{ fill: "currentColor", opacity: 0.6 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--card-border)",
                  borderRadius: "10px", color: "var(--foreground)", fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} iconType="line" />
              <Line type="monotone" dataKey="체중"
                stroke="var(--color-sage-500)" strokeWidth={2}
                dot={{ fill: "var(--color-sage-500)", r: 2.5, strokeWidth: 0 }}
                connectNulls />
              <Line type="monotone" dataKey="골격근량"
                stroke="var(--color-slate-blue-500)" strokeWidth={2}
                dot={{ fill: "var(--color-slate-blue-500)", r: 2.5, strokeWidth: 0 }}
                connectNulls />
              <Line type="monotone" dataKey="체지방량"
                stroke="var(--color-wine-500)" strokeWidth={2}
                dot={{ fill: "var(--color-wine-500)", r: 2.5, strokeWidth: 0 }}
                connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 체지방률 (%) */}
      <div>
        <div className="text-xs text-[color:var(--muted-foreground)] font-medium mb-2">
          체지방률 (%)
        </div>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="currentColor" strokeOpacity={0.08} />
              <XAxis dataKey="date" stroke="currentColor" strokeOpacity={0.4} fontSize={11}
                tick={{ fill: "currentColor", opacity: 0.6 }} />
              <YAxis domain={["auto", "auto"]} stroke="currentColor" strokeOpacity={0.4} fontSize={11}
                tick={{ fill: "currentColor", opacity: 0.6 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--card-border)",
                  borderRadius: "10px", color: "var(--foreground)", fontSize: "12px",
                }}
              />
              <Line type="monotone" dataKey="체지방률"
                stroke="var(--color-terra-500)" strokeWidth={2}
                dot={{ fill: "var(--color-terra-500)", r: 2.5, strokeWidth: 0 }}
                connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
