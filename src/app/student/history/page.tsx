
"use client";

import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { 
  ChevronLeft, 
  Filter, 
  Calendar as CalendarIcon, 
  BarChart, 
  AlertCircle,
  Search,
  Download,
  RefreshCw,
  Activity,
  CheckCircle,
  Clock,
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { doc, getDoc, onSnapshot, collectionGroup, query, where } from 'firebase/firestore';
import { getCorrectStudentAttendanceRecords, type StudentProfile, type AttendanceRecord, type Class } from '@/lib/data';
import { format, isWithinInterval, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek } from 'date-fns';

type FilterPeriod = 'current_month' | 'last_month' | 'current_week' | 'last_week' | 'full_semester';

interface AttendanceHistoryRecord extends AttendanceRecord {
  subject: string;
  teacherName: string;
  className: string;
}

export default function StudentHistoryPage() {
    const [user, loading] = useAuthState(auth);
    const router = useRouter();
    const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceHistoryRecord[]>([]);
    const [studentClasses, setStudentClasses] = useState<Class[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    const [subjectFilter, setSubjectFilter] = useState('all');
    const [periodFilter, setPeriodFilter] = useState<FilterPeriod>('current_month');
    const [searchTerm, setSearchTerm] = useState('');
    const [allSubjects, setAllSubjects] = useState<string[]>([]);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/student/login');
        }
    }, [user, loading, router]);

    // Fetch student profile
    useEffect(() => {
        if (!user) return;

        const studentDocRef = doc(db, 'students', user.uid);
        const unsubscribe = onSnapshot(studentDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const profile = docSnap.data() as StudentProfile;
                setStudentProfile(profile);
            }
        });

        return () => unsubscribe();
    }, [user]);

    // Fetch live attendance data
    useEffect(() => {
        if (!user || !studentProfile) return;

        const fetchAttendanceData = async () => {
            setIsLoading(true);
            try {
                // Get student's attendance records and classes
                const { records, studentClasses } = await getCorrectStudentAttendanceRecords(user.uid);
                
                // Enrich records with class information
                const enrichedRecords: AttendanceHistoryRecord[] = records.map(record => {
                    const classInfo = studentClasses.find(c => c.id === record.classId);
                    return {
                        ...record,
                        subject: classInfo?.subject || 'Unknown Subject',
                        teacherName: classInfo?.teacherName || 'Unknown Teacher',
                        className: classInfo?.subject || 'Unknown Class'
                    };
                });

                setAttendanceRecords(enrichedRecords);
                setStudentClasses(studentClasses);
                
                // Extract unique subjects
                const uniqueSubjects = [...new Set(studentClasses.map(c => c.subject))];
                setAllSubjects(uniqueSubjects);
                
                setLastUpdated(new Date());
            } catch (error) {
                console.error('Error fetching attendance data:', error);
                setError('Could not fetch attendance history. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAttendanceData();

        // Set up real-time listener for attendance records
        const attendanceQuery = query(
            collectionGroup(db, 'records'),
            where('studentId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(attendanceQuery, () => {
            console.log('Attendance record updated - refreshing history');
            fetchAttendanceData();
        });

        return () => unsubscribe();
    }, [user, studentProfile]);

    // Filter records based on search and filters
    const filteredRecords = attendanceRecords.filter(record => {
        // Subject filter
        const subjectMatch = subjectFilter === 'all' || record.subject === subjectFilter;
        
        // Search filter
        const searchMatch = searchTerm === '' || 
            record.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.teacherName.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Period filter
        const recordDate = new Date(record.timestamp);
        const now = new Date();
        
        let periodMatch = false;
        switch (periodFilter) {
            case 'current_month':
                periodMatch = isWithinInterval(recordDate, {
                    start: startOfMonth(now),
                    end: endOfMonth(now)
                });
                break;
            case 'last_month':
                const lastMonth = subMonths(now, 1);
                periodMatch = isWithinInterval(recordDate, {
                    start: startOfMonth(lastMonth),
                    end: endOfMonth(lastMonth)
                });
                break;
            case 'current_week':
                periodMatch = isWithinInterval(recordDate, {
                    start: startOfWeek(now),
                    end: endOfWeek(now)
                });
                break;
            case 'last_week':
                const lastWeek = subMonths(now, 0);
                periodMatch = isWithinInterval(recordDate, {
                    start: startOfWeek(subMonths(lastWeek, 0)),
                    end: endOfWeek(subMonths(lastWeek, 0))
                });
                break;
            case 'full_semester':
                periodMatch = true;
                break;
        }

        return subjectMatch && searchMatch && periodMatch;
    });

    const handleRefresh = async () => {
        setIsRefreshing(true);
        setTimeout(() => {
            setLastUpdated(new Date());
            setIsRefreshing(false);
        }, 1000);
    };

    const handleLogout = async () => {
        await auth.signOut();
        router.push('/');
    };

    if (loading || isLoading || !studentProfile) {
        return (
            <div className="flex min-h-screen w-full flex-col bg-muted/40">
                <Header>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-9 w-24" />
                        <Skeleton className="h-9 w-24" />
                    </div>
                </Header>
                <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                    <Skeleton className="h-8 w-48 mb-4" />
                    <div className="grid gap-4 md:grid-cols-3">
                        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                    </div>
                    <Card>
                        <CardHeader><Skeleton className="h-7 w-64" /></CardHeader>
                        <CardContent>
                           <div className="space-y-4">
                               {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                           </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex min-h-screen w-full flex-col bg-muted/40">
                <Header 
                    onLogout={handleLogout} 
                    user={user}
                    userType="student"
                    userProfile={studentProfile}
                />
                <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                    <div>
                        <Button asChild variant="ghost" className="-ml-4 mb-2">
                            <Link href="/student/dashboard"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
                        </Button>
                    </div>
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 text-red-600">
                                <AlertCircle className="h-5 w-5" />
                                <h3 className="font-semibold">Error</h3>
                            </div>
                            <p className="text-red-700 mt-2">{error}</p>
                            <Button 
                                onClick={() => window.location.reload()} 
                                variant="outline" 
                                className="mt-4"
                            >
                                Try Again
                            </Button>
                        </CardContent>
                    </Card>
                </main>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <Header 
                onLogout={handleLogout} 
                user={user}
                userType="student"
                userProfile={studentProfile}
            />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <Button asChild variant="ghost" className="-ml-4 mb-2">
                            <Link href="/student/dashboard">
                                <ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                            </Link>
                        </Button>
                        <h1 className="font-bold text-2xl">Attendance History</h1>
                        <p className="text-muted-foreground">
                            Live attendance history with filtering and search
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Activity className="h-4 w-4 animate-pulse text-green-600" />
                            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* No classes assigned state */}
                {studentClasses.length === 0 && (
                    <Card className="border-dashed">
                        <CardHeader>
                            <CardTitle>No classes assigned yet</CardTitle>
                            <CardDescription>Once you are assigned to classes, your attendance history will appear here.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild>
                                <Link href="/student/classes">Go to My Classes</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Summary Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                            <BarChart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{attendanceRecords.length}</div>
                            <p className="text-xs text-muted-foreground">
                                All time attendance
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Filtered Results</CardTitle>
                            <Filter className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{filteredRecords.length}</div>
                            <p className="text-xs text-muted-foreground">
                                Matching your filters
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{allSubjects.length}</div>
                            <p className="text-xs text-muted-foreground">
                                Total subjects
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filters & Search
                        </CardTitle>
                        <CardDescription>
                            Filter your attendance history by subject, time period, or search
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-4 md:flex-row md:items-end">
                            <div className="flex-1">
                                <label className="text-sm font-medium mb-2 block">Search</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by subject or teacher..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            
                            <div className="flex-1">
                                <label className="text-sm font-medium mb-2 block">Subject</label>
                                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Subjects" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Subjects</SelectItem>
                                        {allSubjects.map((subject, index) => (
                                            <SelectItem key={`subject-${index}-${subject}`} value={subject}>
                                                {subject}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex-1">
                                <label className="text-sm font-medium mb-2 block">Time Period</label>
                                <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as FilterPeriod)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Period" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="current_week">Current Week</SelectItem>
                                        <SelectItem value="last_week">Last Week</SelectItem>
                                        <SelectItem value="current_month">Current Month</SelectItem>
                                        <SelectItem value="last_month">Last Month</SelectItem>
                                        <SelectItem value="full_semester">Full Semester</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Attendance Records */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5" />
                            Attendance Records
                        </CardTitle>
                        <CardDescription>
                            Your attendance history ({filteredRecords.length} records)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {filteredRecords.length > 0 ? (
                            <div className="space-y-4">
                                {filteredRecords
                                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                    .map((record, index) => (
                                    <div key={index} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="w-2 h-2 bg-green-600 rounded-full flex-shrink-0"></div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold truncate">{record.subject}</h3>
                                                <Badge variant="outline" className="bg-green-100 text-green-800">
                                                    Present
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <CalendarIcon className="h-3 w-3" />
                                                    {format(new Date(record.timestamp), 'MMM dd, yyyy')}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {format(new Date(record.timestamp), 'HH:mm')}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {record.teacherName}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No Records Found</h3>
                                <p className="text-muted-foreground">
                                    {attendanceRecords.length === 0 
                                        ? "You haven't marked attendance for any classes yet."
                                        : "No records match your current filters. Try adjusting your search criteria."
                                    }
                                </p>
                                {(searchTerm || subjectFilter !== 'all' || periodFilter !== 'full_semester') && (
                                    <Button 
                                        variant="outline" 
                                        className="mt-4"
                                        onClick={() => {
                                            setSearchTerm('');
                                            setSubjectFilter('all');
                                            setPeriodFilter('full_semester');
                                        }}
                                    >
                                        Clear All Filters
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
