
"use client";

import type { SubjectStat } from "@/ai/flows/get-student-history";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface SubjectWiseAttendanceProps {
    stats: SubjectStat[];
}

export function SubjectWiseAttendance({ stats }: SubjectWiseAttendanceProps) {
    return (
        <div className="grid gap-6 md:grid-cols-2">
            {stats.map(stat => {
                const percentage = stat.total > 0 ? Math.round((stat.attended / stat.total) * 100) : 0;
                let progressColor = "bg-primary";
                if (percentage < 75) progressColor = "bg-destructive";
                else if (percentage < 90) progressColor = "bg-yellow-500";

                return (
                    <Card key={stat.subject} className="p-4 space-y-2">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold">{stat.subject}</h3>
                            <Badge className={`${progressColor} text-white`}>{percentage}%</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{stat.attended}/{stat.total} classes attended</p>
                        <Progress value={percentage} className="h-2 [&>div]:bg-primary" />
                    </Card>
                )
            })}
        </div>
    )
}
