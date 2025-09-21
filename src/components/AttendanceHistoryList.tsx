
"use client";

import type { StudentHistoryRecord } from '@/lib/client-stats';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, formatTime } from '@/lib/utils';
import { CheckCircle, XCircle, Calendar, Clock, User } from 'lucide-react';
import { format as formatDate } from 'date-fns';

interface AttendanceHistoryListProps {
    records: StudentHistoryRecord[];
}

export function AttendanceHistoryList({ records }: AttendanceHistoryListProps) {
    if (records.length === 0) {
        return (
            <div className="text-center py-16 text-muted-foreground bg-card rounded-lg border border-dashed mt-4">
                <p className="font-semibold">No records found</p>
                <p className="text-sm">There are no attendance records that match your current filters.</p>
            </div>
        )
    }

    // Sort by date descending
    const sortedRecords = [...records].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="space-y-3">
            {sortedRecords.map((record, index) => {
                const status = record.attended ? 'Present' : 'Absent' as const;
                return (
                    <Card key={`attendance-record-${record.classId}-${record.date}-${index}`} className="flex items-center justify-between p-4 transition-all hover:shadow-md hover:border-primary/50">
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                               <h3 className="font-semibold text-base">{record.subject}</h3>
                               <Badge variant={status === 'Present' ? 'default' : 'destructive'}
                                      className={cn(status === 'Present' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200', 'font-medium')}
                               >
                                {status}
                               </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-1.5">
                                <p className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {formatDate(new Date(record.date), 'EEE, MMM d, yyyy')}</p>
                                {/* Optional fields below may not exist; render only if available via future enhancements */}
                            </div>
                            {status === 'Present' && record.timestamp && (
                               <p className="text-xs text-green-600">Marked at: {formatDate(new Date(record.timestamp), 'hh:mm a')}</p>
                            )}
                        </div>
                        <div className="pl-4">
                            {status === 'Present' 
                                ? <CheckCircle className="h-6 w-6 text-green-500" />
                                : <XCircle className="h-6 w-6 text-red-500" />
                            }
                        </div>
                    </Card>
                );
            })}
        </div>
    )
}
