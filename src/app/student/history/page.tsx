
"use client";

import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft, Filter, Calendar as CalendarIcon, BarChart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getStudentHistoryAction } from '@/lib/actions';
import type { GetStudentHistoryOutput } from '@/ai/flows/get-student-history';
import { Skeleton } from '@/components/ui/skeleton';
import { SubjectWiseAttendance } from '@/components/SubjectWiseAttendance';
import { AttendanceHistoryList } from '@/components/AttendanceHistoryList';
import { doc, getDoc } from 'firebase/firestore';
import { getStudentClasses, type StudentProfile } from '@/lib/data';

type FilterPeriod = 'current_month' | 'last_month' | 'full_semester';

export default function StudentHistoryPage() {
    const [user, loading] = useAuthState(auth);
    const router = useRouter();
    const [historyData, setHistoryData] = useState<GetStudentHistoryOutput | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const [subjectFilter, setSubjectFilter] = useState('all');
    const [periodFilter, setPeriodFilter] = useState<FilterPeriod>('current_month');
    const [allSubjects, setAllSubjects] = useState<string[]>([]);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/student/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        const fetchHistoryAndSubjects = async () => {
            if (user) {
                setIsLoading(true);
                try {
                    // Fetch student profile to get department and semester
                    const studentDocRef = doc(db, 'students', user.uid);
                    const studentDocSnap = await getDoc(studentDocRef);

                    if (studentDocSnap.exists()) {
                        const studentProfile = studentDocSnap.data() as StudentProfile;
                        if (studentProfile.department && studentProfile.semester) {
                            // Fetch all class subjects for the student
                            const studentClasses = await getStudentClasses(studentProfile.department, studentProfile.semester);
                            setAllSubjects(studentClasses.map(c => c.subject));
                        }
                    }

                    // Fetch the detailed history data
                    const data = await getStudentHistoryAction(user.uid);
                    setHistoryData(data);

                } catch (error) {
                    console.error("Failed to fetch student history:", error);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        if (user) {
            fetchHistoryAndSubjects();
        }
    }, [user]);
    
    const filteredRecords = historyData?.records.filter(record => {
        const subjectMatch = subjectFilter === 'all' || record.subject === subjectFilter;
        
        const recordDate = new Date(record.date);
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        let periodMatch = false;
        switch (periodFilter) {
            case 'current_month':
                periodMatch = recordDate >= firstDayOfMonth;
                break;
            case 'last_month':
                periodMatch = recordDate >= firstDayOfLastMonth && recordDate <= lastDayOfLastMonth;
                break;
            case 'full_semester':
                periodMatch = true;
                break;
        }

        return subjectMatch && periodMatch;
    });

    if (loading || isLoading) {
        return (
            <div className="flex min-h-screen w-full flex-col bg-muted/40">
                <Header />
                <main className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
                    <Skeleton className="h-8 w-48" />
                    <Card>
                        <CardHeader><Skeleton className="h-7 w-64" /></CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2">
                           <Skeleton className="h-24 w-full" />
                           <Skeleton className="h-24 w-full" />
                           <Skeleton className="h-24 w-full" />
                           <Skeleton className="h-24 w-full" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><Skeleton className="h-7 w-48" /></CardHeader>
                        <CardContent className="flex gap-4">
                           <Skeleton className="h-10 w-full" />
                           <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                </main>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <Header />
            <main className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
                <div>
                    <Button asChild variant="ghost" className="-ml-4 mb-2">
                        <Link href="/student/dashboard"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">Your Attendance History</h1>
                </div>

                <Card className="rounded-xl">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <BarChart className="h-5 w-5 text-primary" />
                            <CardTitle>Subject-wise Attendance</CardTitle>
                        </div>
                        <CardDescription>Your attendance percentage by subject for the entire semester.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {historyData?.subjectStats && historyData.subjectStats.length > 0 ? (
                           <SubjectWiseAttendance stats={historyData.subjectStats} />
                        ) : (
                           <p className="text-muted-foreground">No attendance data available to show stats.</p>
                        )}
                    </CardContent>
                </Card>
                
                <Card className="rounded-xl">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Filter className="h-5 w-5 text-primary" />
                            <CardTitle>Filter Records</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-col md:flex-row gap-4">
                        <div className="grid gap-2 flex-1">
                            <label className="text-sm font-medium">Subject</label>
                            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Subjects</SelectItem>
                                    {allSubjects.map(subject => <SelectItem key={subject} value={subject}>{subject}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2 flex-1">
                            <label className="text-sm font-medium">Time Period</label>
                            <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as FilterPeriod)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Period" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="current_month">Current Month</SelectItem>
                                    <SelectItem value="last_month">Last Month</SelectItem>
                                    <SelectItem value="full_semester">Full Semester</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-xl">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 text-primary" />
                            <CardTitle>Attendance Records</CardTitle>
                        </div>
                        <CardDescription>Showing {filteredRecords?.length || 0} records.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AttendanceHistoryList records={filteredRecords || []} />
                    </CardContent>
                </Card>

            </main>
        </div>
    );
}
