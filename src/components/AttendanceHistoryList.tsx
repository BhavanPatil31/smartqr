
"use client";

import type { StudentHistoryRecord } from '@/ai/flows/get-student-history';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Calendar, Clock, User } from 'lucide-react';
import { format } from 'date-fns';

interface AttendanceHistoryListProps {
    records: StudentHistoryRecord[];
}

export function AttendanceHistoryList({ records }: AttendanceHistoryListProps) {
    if (records.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p>No records match your current filters.</p>
            </div>
        )
    }

    // Sort by date descending
    const sortedRecords = [...records].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="space-y-4">
            {sortedRecords.map((record, index) => (
                <Card key={index} className="flex items-center justify-between p-4 transition-all hover:bg-muted/50">
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-4">
                           <h3 className="font-semibold">{record.subject}</h3>
                           <Badge variant={record.status === 'Present' ? 'default' : 'destructive'}
                                  className={cn(record.status === 'Present' ? 'bg-green-600' : 'bg-red-600', 'text-white')}
                           >
                            {record.status}
                           </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground flex flex-col md:flex-row md:items-center md:gap-6 gap-1">
                            <p className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {format(new Date(record.date), 'EEE, MMM d, yyyy')}</p>
                            <p className="flex items-center gap-2"><Clock className="h-4 w-4" /> {record.startTime} - {record.endTime}</p>
                            <p className="flex items-center gap-2"><User className="h-4 w-4" /> Teacher: {record.teacherName}</p>
                        </div>
                        {record.status === 'Present' && record.markedAt && (
                           <p className="text-sm text-green-600">Marked at: {format(new Date(record.markedAt), 'hh:mm a')}</p>
                        )}
                    </div>
                    <div>
                        {record.status === 'Present' 
                            ? <CheckCircle className="h-6 w-6 text-green-500" />
                            : <XCircle className="h-6 w-6 text-red-500" />
                        }
                    </div>
                </Card>
            ))}
        </div>
    )
}
