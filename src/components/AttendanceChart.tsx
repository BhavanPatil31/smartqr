
"use client";

import { TrendingUp } from "lucide-react"
import { Pie, PieChart, Cell, ResponsiveContainer } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const COLORS = ["hsl(var(--primary))", "hsl(var(--muted))"];

interface AttendanceChartProps {
    attended: number;
    total: number;
}

export function AttendanceChart({ attended, total }: AttendanceChartProps) {
  const missed = total - attended;
  const attendanceRate = total > 0 ? Math.round((attended / total) * 100) : 0;

  const chartData = [
    { name: "Attended", value: attended, fill: "hsl(var(--primary))" },
    { name: "Missed", value: missed, fill: "hsl(var(--muted))" },
  ]
  
  return (
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
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
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
  )
}
