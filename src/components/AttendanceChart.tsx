
"use client";

import { Pie, PieChart, Cell, ResponsiveContainer } from "recharts"
import { CheckCircle2, XCircle } from "lucide-react"

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
    color: "#10b981", // green-500
  },
  missed: {
    label: "Missed", 
    color: "#ef4444", // red-500
  },
} satisfies ChartConfig;

export function AttendanceChart({ attended, total }: AttendanceChartProps) {
  const missed = total - attended;
  const attendanceRate = total > 0 ? Math.round((attended / total) * 100) : 0;

  const chartData = [
    { name: "attended", value: attended, fill: "#10b981" },
    { name: "missed", value: missed, fill: "#ef4444" },
  ]

  const getStatusColor = (rate: number) => {
    if (rate >= 90) return "text-green-600";
    if (rate >= 75) return "text-blue-600";
    if (rate >= 60) return "text-yellow-600";
    return "text-red-600";
  }
  
  return (
    <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
      <ChartContainer config={chartConfig} className="w-full h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius="70%"
              innerRadius="45%"
              paddingAngle={2}
              labelLine={false}
              stroke="none"
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
              y="45%"
              textAnchor="middle"
              dominantBaseline="middle"
              className={`text-4xl font-bold ${getStatusColor(attendanceRate)}`}
            >
              {attendanceRate}%
            </text>
            <text
              x="50%"
              y="55%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-sm text-slate-500 font-medium"
            >
              Attendance
            </text>
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
      
      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-slate-600">Attended ({attended})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-slate-600">Missed ({missed})</span>
        </div>
      </div>
    </div>
  )
}
