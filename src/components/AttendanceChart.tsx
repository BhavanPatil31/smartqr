
"use client";

import { Pie, PieChart, Cell, ResponsiveContainer } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface AttendanceChartProps {
    attended: number;
    total: number;
}

const chartConfig = {
  attended: {
    label: "Attended",
    color: "hsl(var(--primary))",
  },
  missed: {
    label: "Missed",
    color: "hsl(var(--muted))",
  },
} satisfies ChartConfig;


export function AttendanceChart({ attended, total }: AttendanceChartProps) {
  const missed = total - attended;
  const attendanceRate = total > 0 ? Math.round((attended / total) * 100) : 0;

  const chartData = [
    { name: "attended", value: attended, fill: "hsl(var(--primary))" },
    { name: "missed", value: missed, fill: "hsl(var(--muted))" },
  ]
  
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius="80%"
            innerRadius="60%"
            paddingAngle={5}
            labelLine={false}
          >
            {chartData.map((entry) => (
              <Cell key={`cell-${entry.name}`} fill={entry.fill} />
            ))}
          </Pie>
          <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
          <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground text-3xl font-bold"
            >
              {attendanceRate}%
            </text>
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
