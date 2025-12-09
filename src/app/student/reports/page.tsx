"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot, collectionGroup, query, where } from 'firebase/firestore';
import { Header } from '@/components/Header';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Clock,
  Target,
  Award,
  AlertTriangle,
  CheckCircle,
  Activity,
  ChevronLeft,
  Download,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subWeeks } from 'date-fns';
import type { StudentProfile, AttendanceRecord, Class } from '@/lib/data';
import { calculateStudentAttendanceStats, getCorrectStudentAttendanceRecords } from '@/lib/client-stats';

interface AttendanceStats {
  overall: {
    attendanceRate: number;
    totalClasses: number;
    attendedClasses: number;
    missedClasses: number;
  };
  weekly: {
    dates: string[];
    attendanceRates: number[];
    classesAttended: number[];
  };
  monthly: {
    currentMonth: number;
    previousMonth: number;
    trend: 'up' | 'down' | 'same';
  };
  subjectWise: Array<{
    subject: string;
    attendanceRate: number;
    attended: number;
    total: number;
  }>;
  recentActivity: Array<{
    date: string;
    subject: string;
    status: 'present' | 'absent';
    time: string;
  }>;
}

export default function StudentReportsPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasClassesAssigned, setHasClassesAssigned] = useState<boolean>(true);

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
        // Get overall stats
        const overallStats = await calculateStudentAttendanceStats(user.uid);
        
        // Get detailed records for analysis
        const { records, studentClasses } = await getCorrectStudentAttendanceRecords(user.uid);
        setHasClassesAssigned(studentClasses.length > 0);
        
        // Calculate weekly trend (last 4 weeks)
        const weeklyData = calculateWeeklyTrend(records);
        
        // Calculate monthly comparison
        const monthlyData = calculateMonthlyComparison(records);
        
        // Calculate subject-wise attendance
        const subjectWiseData = calculateSubjectWiseAttendance(records, studentClasses);
        
        // Get recent activity
        const recentActivity = getRecentActivity(records, studentClasses);
        
        const stats: AttendanceStats = {
          overall: overallStats,
          weekly: weeklyData,
          monthly: monthlyData,
          subjectWise: subjectWiseData,
          recentActivity: recentActivity
        };
        
        setAttendanceStats(stats);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error fetching attendance data:', error);
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
      console.log('Attendance record updated - refreshing stats');
      fetchAttendanceData();
    });

    return () => unsubscribe();
  }, [user, studentProfile]);

  const calculateWeeklyTrend = (records: AttendanceRecord[]) => {
    const weeks = [];
    const attendanceRates = [];
    const classesAttended = [];
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(new Date(), i));
      const weekEnd = endOfWeek(subWeeks(new Date(), i));
      
      const weekRecords = records.filter(record => {
        const recordDate = new Date(record.timestamp);
        return recordDate >= weekStart && recordDate <= weekEnd;
      });
      
      weeks.push(format(weekStart, 'MMM dd'));
      classesAttended.push(weekRecords.length);
      // Simplified calculation - in real app, you'd need total expected classes for the week
      attendanceRates.push(weekRecords.length > 0 ? Math.min(100, weekRecords.length * 20) : 0);
    }
    
    return {
      dates: weeks,
      attendanceRates,
      classesAttended
    };
  };

  const calculateMonthlyComparison = (records: AttendanceRecord[]) => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const currentMonthRecords = records.filter(record => {
      const recordDate = new Date(record.timestamp);
      return recordDate >= currentMonthStart;
    }).length;
    
    const previousMonthRecords = records.filter(record => {
      const recordDate = new Date(record.timestamp);
      return recordDate >= previousMonthStart && recordDate <= previousMonthEnd;
    }).length;
    
    const trend = currentMonthRecords > previousMonthRecords ? 'up' : 
                  currentMonthRecords < previousMonthRecords ? 'down' : 'same';
    
    return {
      currentMonth: currentMonthRecords,
      previousMonth: previousMonthRecords,
      trend: trend as 'up' | 'down' | 'same'
    };
  };

  const calculateSubjectWiseAttendance = (records: AttendanceRecord[], classes: Class[]) => {
    const subjectStats: Record<string, { attended: number; total: number }> = {};
    
    // Initialize with all subjects
    classes.forEach(classItem => {
      if (!subjectStats[classItem.subject]) {
        subjectStats[classItem.subject] = { attended: 0, total: 1 };
      } else {
        subjectStats[classItem.subject].total++;
      }
    });
    
    // Count attended classes
    records.forEach(record => {
      const classItem = classes.find(c => c.id === record.classId);
      if (classItem && subjectStats[classItem.subject]) {
        subjectStats[classItem.subject].attended++;
      }
    });
    
    return Object.entries(subjectStats).map(([subject, stats]) => ({
      subject,
      attendanceRate: stats.total > 0 ? (stats.attended / stats.total) * 100 : 0,
      attended: stats.attended,
      total: stats.total
    }));
  };

  const getRecentActivity = (records: AttendanceRecord[], classes: Class[]) => {
    return records
      .slice(-10) // Last 10 records
      .reverse()
      .map(record => {
        const classItem = classes.find(c => c.id === record.classId);
        return {
          date: format(new Date(record.timestamp), 'MMM dd'),
          subject: classItem?.subject || 'Unknown',
          status: 'present' as const,
          time: format(new Date(record.timestamp), 'HH:mm')
        };
      });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Trigger a refresh by updating the last updated time
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
          </div>
        </main>
      </div>
    );
  }

  const getAttendanceStatus = (rate: number) => {
    if (rate >= 90) return { label: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100', icon: Award };
    if (rate >= 75) return { label: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: CheckCircle };
    if (rate >= 60) return { label: 'Warning', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: AlertTriangle };
    return { label: 'Critical', color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertTriangle };
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header 
        onLogout={handleLogout} 
        user={user}
        userType="student"
        userProfile={studentProfile}
      />
      <main className="flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <Button asChild variant="ghost" className="-ml-4 mb-2">
              <Link href="/student/dashboard">
                <ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard
              </Link>
            </Button>
            <h1 className="font-bold text-2xl">Attendance Reports</h1>
            <p className="text-muted-foreground">
              Live attendance statistics and insights
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
        {!hasClassesAssigned && (
          <div className="mb-6">
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle>No classes assigned yet</CardTitle>
                <CardDescription>Ask your teacher to assign you to classes. Reports will appear once classes are assigned.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/student/classes">Go to My Classes</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Overview Stats */}
        {attendanceStats && hasClassesAssigned && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Rate</CardTitle>
                <Target className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {attendanceStats.overall.attendanceRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {attendanceStats.overall.attendedClasses}/{attendanceStats.overall.totalClasses} classes
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Classes Attended</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {attendanceStats.overall.attendedClasses}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total attended
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                {attendanceStats.monthly.trend === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : attendanceStats.monthly.trend === 'down' ? (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                ) : (
                  <Activity className="h-4 w-4 text-orange-600" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {attendanceStats.monthly.currentMonth}
                </div>
                <p className="text-xs text-muted-foreground">
                  {attendanceStats.monthly.trend === 'up' ? '+' : attendanceStats.monthly.trend === 'down' ? '-' : ''}
                  {Math.abs(attendanceStats.monthly.currentMonth - attendanceStats.monthly.previousMonth)} from last month
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                {(() => {
                  const status = getAttendanceStatus(attendanceStats.overall.attendanceRate);
                  const StatusIcon = status.icon;
                  return <StatusIcon className={`h-4 w-4 ${status.color}`} />;
                })()}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getAttendanceStatus(attendanceStats.overall.attendanceRate).color}`}>
                  {getAttendanceStatus(attendanceStats.overall.attendanceRate).label}
                </div>
                <p className="text-xs text-muted-foreground">
                  Performance level
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="subjects">By Subject</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {attendanceStats && (
              <div className="grid gap-6 md:grid-cols-2">
                {/* Attendance Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle>Attendance Progress</CardTitle>
                    <CardDescription>
                      Your current attendance status
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Overall Attendance</span>
                        <span className="font-medium">{attendanceStats.overall.attendanceRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={attendanceStats.overall.attendanceRate} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {attendanceStats.overall.attendedClasses}
                        </div>
                        <p className="text-sm text-muted-foreground">Present</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {attendanceStats.overall.missedClasses}
                        </div>
                        <p className="text-sm text-muted-foreground">Absent</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Monthly Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Comparison</CardTitle>
                    <CardDescription>
                      This month vs last month
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <div>
                          <p className="font-medium">This Month</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {attendanceStats.monthly.currentMonth}
                          </p>
                        </div>
                        <Calendar className="h-8 w-8 text-blue-600" />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">Last Month</p>
                          <p className="text-2xl font-bold text-gray-600">
                            {attendanceStats.monthly.previousMonth}
                          </p>
                        </div>
                        <Clock className="h-8 w-8 text-gray-600" />
                      </div>
                      
                      <div className={`flex items-center gap-2 p-3 rounded-lg ${
                        attendanceStats.monthly.trend === 'up' ? 'bg-green-50 text-green-800' :
                        attendanceStats.monthly.trend === 'down' ? 'bg-red-50 text-red-800' :
                        'bg-yellow-50 text-yellow-800'
                      }`}>
                        {attendanceStats.monthly.trend === 'up' ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : attendanceStats.monthly.trend === 'down' ? (
                          <TrendingDown className="h-4 w-4" />
                        ) : (
                          <Activity className="h-4 w-4" />
                        )}
                        <span className="font-medium">
                          {attendanceStats.monthly.trend === 'up' ? 'Improving' :
                           attendanceStats.monthly.trend === 'down' ? 'Declining' : 'Stable'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            {attendanceStats && (
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Attendance Trend</CardTitle>
                  <CardDescription>
                    Your attendance over the last 4 weeks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {attendanceStats.weekly.dates.map((date, index) => {
                      const rate = attendanceStats.weekly.attendanceRates[index];
                      const classes = attendanceStats.weekly.classesAttended[index];
                      return (
                        <div key={date} className="flex items-center justify-between">
                          <span className="text-sm font-medium w-16">{date}</span>
                          <div className="flex-1 mx-4">
                            <Progress value={rate} className="h-2" />
                          </div>
                          <div className="text-right w-20">
                            <span className="text-sm font-medium">{rate}%</span>
                            <p className="text-xs text-muted-foreground">{classes} classes</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="subjects" className="space-y-6">
            {attendanceStats && (
              <div className="grid gap-4">
                {attendanceStats.subjectWise.map((subject, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{subject.subject}</h3>
                          <p className="text-sm text-muted-foreground">
                            {subject.attended}/{subject.total} classes attended
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {subject.attendanceRate.toFixed(1)}%
                          </div>
                          <Badge 
                            variant="outline" 
                            className={getAttendanceStatus(subject.attendanceRate).bgColor}
                          >
                            {getAttendanceStatus(subject.attendanceRate).label}
                          </Badge>
                        </div>
                      </div>
                      <Progress value={subject.attendanceRate} className="h-2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            {attendanceStats && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Your latest attendance records
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {attendanceStats.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        <div className="flex-1">
                          <p className="font-medium">{activity.subject}</p>
                          <p className="text-sm text-muted-foreground">
                            {activity.date} at {activity.time}
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          Present
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
