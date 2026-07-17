"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function TimeSeriesChart({
  data,
  color = "#18181b",
  valueLabel,
}: {
  data: { date: string; value: number }[];
  color?: string;
  valueLabel: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
        <XAxis
          dataKey="date"
          tickFormatter={(value: string) => value.slice(5)}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis fontSize={12} tickLine={false} axisLine={false} width={36} />
        <Tooltip formatter={(value) => [value, valueLabel]} />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
