
"use client";

import type { SubjectStat } from "@/ai/flows/get-student-history";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface SubjectWiseAttendanceProps {
    stats: SubjectStat[];
}

export function SubjectWiseAttendance({ stats }: SubjectWiseAttendanceProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            {stats.map(stat => {
                const percentage = stat.total > 0 ? Math.round((stat.attended / stat.total) * 100) : 0;
                
                let progressColorClass = "bg-green-500";
                let badgeColorClass = "bg-green-100 text-green-800 border-green-200 hover:bg-green-100";
                
                if (percentage < 75) {
                    progressColorClass = "bg-red-500";
                    badgeColorClass = "bg-red-100 text-red-800 border-red-200 hover:bg-red-100";
                } else if (percentage < 90) {
                    progressColorClass = "bg-orange-500";
                    badgeColorClass = "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100";
                }

                return (
                    <Card key={stat.subject} className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                           <div>
                             <h3 className="font-semibold text-base">{stat.subject}</h3>
                             <p className="text-sm text-muted-foreground">{stat.attended}/{stat.total} classes attended</p>
                           </div>
                           <Badge className={badgeColorClass}>{percentage}%</Badge>
                        </div>
                        <Progress value={percentage} className="h-2" indicatorClassName={progressColorClass} />
                    </Card>
                )
            })}
        </div>
    )
}
