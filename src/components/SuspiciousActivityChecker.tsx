
'use client';

import { useState } from 'react';
import type { DetectSuspiciousAttendanceOutput } from '@/ai/flows/detect-suspicious-attendance';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb, ShieldAlert, Sparkles } from 'lucide-react';
import type { AttendanceRecord, Class } from '@/lib/data';
import { checkSuspiciousActivityAction } from '@/lib/actions';

interface SuspiciousActivityCheckerProps {
    classItem: Class;
    attendanceRecords: AttendanceRecord[];
}

export function SuspiciousActivityChecker({ classItem, attendanceRecords }: SuspiciousActivityCheckerProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<DetectSuspiciousAttendanceOutput | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleCheck = async () => {
        setIsLoading(true);
        setResult(null);
        setError(null);
        try {
            const output = await checkSuspiciousActivityAction(classItem.id, attendanceRecords);
            setResult(output);
        } catch (e) {
            setError('An error occurred while analyzing attendance.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Button onClick={handleCheck} disabled={isLoading || attendanceRecords.length === 0}>
                    {isLoading ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Detect Suspicious Activity
                        </>
                    )}
                </Button>
                {attendanceRecords.length === 0 && <p className="text-sm text-muted-foreground">Analysis available once students check in.</p>}
            </div>

            {result && (
                <Alert variant={result.isSuspicious ? 'destructive' : 'default'} className="mt-4">
                    {result.isSuspicious ? <ShieldAlert className="h-4 w-4" /> : <Lightbulb className="h-4 w-4" />}
                    <AlertTitle>{result.isSuspicious ? 'Suspicious Activity Detected' : 'Analysis Complete'}</AlertTitle>
                    <AlertDescription>
                        {result.summary}
                    </AlertDescription>
                </Alert>
            )}
            {error && (
                 <Alert variant="destructive" className="mt-4">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
        </div>
    );
}
