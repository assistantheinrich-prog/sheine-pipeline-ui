"use client";

import type { DayBucket } from "@/lib/posts";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export function AnalyticsCharts({ data }: { data: DayBucket[] }) {
  const fmt = (s: string) => s.slice(5);
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 12, bottom: 6, left: 0 }}>
          <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={fmt}
            stroke="#a1a1aa"
            fontSize={11}
            tickMargin={6}
          />
          <YAxis stroke="#a1a1aa" fontSize={11} allowDecimals={false} width={32} />
          <Tooltip
            contentStyle={{
              background: "#ffffff",
              border: "1px solid #e4e4e7",
              borderRadius: 6,
              fontSize: 12,
              color: "#09090b",
            }}
            labelFormatter={(l) => `Day ${l}`}
            formatter={(v: number, n: string) => [v, n]}
          />
          <Bar dataKey="posts" name="Posts" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Line
            type="monotone"
            dataKey="likes"
            name="Likes"
            stroke="#16a34a"
            strokeWidth={2}
            dot={{ r: 2, fill: "#16a34a" }}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="replies"
            name="Replies"
            stroke="#d97706"
            strokeWidth={2}
            dot={{ r: 2, fill: "#d97706" }}
            activeDot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
