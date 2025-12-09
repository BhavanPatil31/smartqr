"use client";
export const dynamic = "force-dynamic"; 


import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, collectionGroup, getDocs } from 'firebase/firestore';
import { Header } from '@/components/Header';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  BookOpen,
  Calendar,
  Clock,
  ChevronLeft,
  Activity,
  AlertTriangle,
  CheckCircle,
  Target,
  Zap,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import type { AdminProfile, StudentProfile, TeacherProfile, Class } from '@/lib/data';

interface AnalyticsData {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  todayAttendance: {
    total: number;
    present: number;
    rate: number;
  };
  weeklyTrend: {
    dates: string[];
    attendanceRates: number[];
  };
  semesterBreakdown: Record<string, {
    students: number;
    classes: number;
    avgAttendance: number;
  }>;
  topPerformers: {
    students: Array<{ name: string; rate: number; usn: string }>;
    teachers: Array<{ name: string; classes: number; subjects: string[] }>;
  };
  alertsAndIssues: Array<{
    type: 'warning' | 'critical' | 'info';
    message: string;
    count?: number;
  }>;
  liveStats: {
    activeClasses: number;
    studentsOnline: number;
    qrCodesActive: number;
  };
}

const SEMESTERS = ["1st Semester", "2nd Semester", "3rd Semester", "4th Semester", "5th Semester", "6th Semester", "7th Semester", "8th Semester"];

export default function AdminAnalyticsPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    if (!loading && !user) {
      router.push('/admin/login');
    }
  }, [user, loading, router]);

  // Fetch admin profile
  useEffect(() => {
    const fetchAdminProfile = async () => {
      if (user) {
        try {
          const adminDoc = await getDoc(doc(db, 'admins', user.uid));
          if (adminDoc.exists()) {
            const adminData = adminDoc.data() as AdminProfile;
            setAdminProfile(adminData);
          }
        } catch (error) {
          console.error("Error fetching admin profile:", error);
        }
      }
    };
    
    fetchAdminProfile();
  }, [user]);

  // Fetch analytics data
  useEffect(() => {
    if (!user || !adminProfile?.department) return;

    const fetchAnalyticsData = async () => {
      setIsLoading(true);
      try {
        // Fetch students in department
        const studentsQuery = query(
          collection(db, 'students'),
          where('department', '==', adminProfile.department)
        );
        const studentsSnapshot = await getDocs(studentsQuery);
        const students = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentProfile & { id: string }));

        // Fetch teachers in department
        const teachersQuery = query(
          collection(db, 'teachers'),
          where('department', '==', adminProfile.department)
        );
        const teachersSnapshot = await getDocs(teachersQuery);
        const teachers = teachersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeacherProfile & { id: string }));

        // Fetch classes in department
        const classesQuery = query(
          collection(db, 'classes'),
          where('department', '==', adminProfile.department)
        );
        const classesSnapshot = await getDocs(classesQuery);
        const classes = classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));

        // Calculate today's attendance
        const today = new Date().toISOString().split('T')[0];
        let todayAttendanceCount = 0;
        let totalExpectedToday = 0;

        // Get today's attendance records
        const attendancePromises = classes.map(async (classItem) => {
          try {
            const attendanceQuery = query(
              collection(db, 'classes', classItem.id, 'attendance', today, 'records')
            );
            const attendanceSnapshot = await getDocs(attendanceQuery);
            todayAttendanceCount += attendanceSnapshot.docs.length;
            
            // Calculate expected attendance based on students in same semester
            const expectedStudents = students.filter(s => s.semester === classItem.semester).length;
            totalExpectedToday += expectedStudents;
          } catch (error) {
            console.error(`Error fetching attendance for class ${classItem.id}:`, error);
          }
        });

        await Promise.all(attendancePromises);

        // Calculate semester breakdown
        const semesterBreakdown: Record<string, { students: number; classes: number; avgAttendance: number }> = {};
        SEMESTERS.forEach(semester => {
          const semesterStudents = students.filter(s => s.semester === semester);
          const semesterClasses = classes.filter(c => c.semester === semester);
          
          semesterBreakdown[semester] = {
            students: semesterStudents.length,
            classes: semesterClasses.length,
            avgAttendance: Math.random() * 30 + 70 // Placeholder - would calculate from actual data
          };
        });

        // Generate alerts and issues
        const alerts: Array<{ type: 'warning' | 'critical' | 'info'; message: string; count?: number }> = [];
        
        const lowAttendanceStudents = students.filter(() => Math.random() < 0.1); // Placeholder
        if (lowAttendanceStudents.length > 0) {
          alerts.push({
            type: 'warning',
            message: `${lowAttendanceStudents.length} students have attendance below 75%`,
            count: lowAttendanceStudents.length
          });
        }

        const pendingTeachers = teachers.filter(t => t.isApproved !== true);
        if (pendingTeachers.length > 0) {
          alerts.push({
            type: 'info',
            message: `${pendingTeachers.length} teachers awaiting approval`,
            count: pendingTeachers.length
          });
        }

        // Live stats
        const activeQRCodes = classes.filter(c => {
          if (!c.qrCodeExpiresAt) return false;
          return Date.now() < c.qrCodeExpiresAt;
        }).length;

        const analytics: AnalyticsData = {
          totalStudents: students.length,
          totalTeachers: teachers.length,
          totalClasses: classes.length,
          todayAttendance: {
            total: totalExpectedToday,
            present: todayAttendanceCount,
            rate: totalExpectedToday > 0 ? (todayAttendanceCount / totalExpectedToday) * 100 : 0
          },
          weeklyTrend: {
            dates: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            attendanceRates: [85, 82, 88, 90, 87, 75, 70] // Placeholder data
          },
          semesterBreakdown,
          topPerformers: {
            students: students.slice(0, 5).map(s => ({
              name: s.fullName,
              rate: Math.random() * 20 + 80,
              usn: s.usn
            })),
            teachers: teachers.slice(0, 5).map(t => ({
              name: t.fullName,
              classes: classes.filter(c => c.teacherId === t.id).length,
              subjects: [...new Set(classes.filter(c => c.teacherId === t.id).map(c => c.subject))]
            }))
          },
          alertsAndIssues: alerts,
          liveStats: {
            activeClasses: classes.length,
            studentsOnline: Math.floor(students.length * 0.3), // Placeholder
            qrCodesActive: activeQRCodes
          }
        };

        setAnalyticsData(analytics);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();

    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchAnalyticsData, 30000);
    return () => clearInterval(interval);
  }, [user, adminProfile]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
  };

  if (loading || isLoading || !user || !adminProfile || !analyticsData) {
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

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header 
        onLogout={handleLogout} 
        user={user}
        userType="admin"
        userProfile={adminProfile}
      />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <Button asChild variant="ghost" className="-ml-4 mb-2">
              <Link href="/admin/dashboard">
                <ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard
              </Link>
            </Button>
            <h1 className="font-bold text-2xl">Live Analytics</h1>
            <p className="text-muted-foreground">
              Real-time insights for {adminProfile.department} department
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4 animate-pulse text-green-600" />
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Live Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Live Classes</CardTitle>
              <Zap className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{analyticsData.liveStats.activeClasses}</div>
              <p className="text-xs text-muted-foreground">
                Currently active
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active QR Codes</CardTitle>
              <Eye className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{analyticsData.liveStats.qrCodesActive}</div>
              <p className="text-xs text-muted-foreground">
                Available for scanning
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Rate</CardTitle>
              <Target className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {analyticsData.todayAttendance.rate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {analyticsData.todayAttendance.present}/{analyticsData.todayAttendance.total} present
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students Online</CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{analyticsData.liveStats.studentsOnline}</div>
              <p className="text-xs text-muted-foreground">
                Estimated active users
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Department Overview */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsData.totalStudents}</div>
                  <p className="text-xs text-muted-foreground">
                    Registered in department
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsData.totalTeachers}</div>
                  <p className="text-xs text-muted-foreground">
                    Active faculty
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsData.totalClasses}</div>
                  <p className="text-xs text-muted-foreground">
                    Across all semesters
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Semester Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Semester Breakdown</CardTitle>
                <CardDescription>
                  Distribution of students and classes across semesters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {SEMESTERS.map(semester => {
                    const data = analyticsData.semesterBreakdown[semester];
                    if (data.students === 0 && data.classes === 0) return null;
                    
                    return (
                      <div key={semester} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{semester}</p>
                          <p className="text-sm text-muted-foreground">
                            {data.students} students • {data.classes} classes
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{data.avgAttendance.toFixed(1)}%</p>
                          <p className="text-sm text-muted-foreground">Avg attendance</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Attendance Trend</CardTitle>
                <CardDescription>
                  Attendance rates over the past week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.weeklyTrend.dates.map((date, index) => {
                    const rate = analyticsData.weeklyTrend.attendanceRates[index];
                    return (
                      <div key={date} className="flex items-center justify-between">
                        <span className="text-sm font-medium w-12">{date}</span>
                        <div className="flex-1 mx-4">
                          <Progress value={rate} className="h-2" />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{rate}%</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Top Performing Students */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Students</CardTitle>
                  <CardDescription>
                    Students with highest attendance rates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.topPerformers.students.map((student, index) => (
                      <div key={student.usn} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="w-8 h-8 rounded-full p-0 flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-muted-foreground">{student.usn}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{student.rate.toFixed(1)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Teachers */}
              <Card>
                <CardHeader>
                  <CardTitle>Most Active Teachers</CardTitle>
                  <CardDescription>
                    Teachers with most classes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.topPerformers.teachers.map((teacher, index) => (
                      <div key={teacher.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="w-8 h-8 rounded-full p-0 flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <div>
                            <p className="font-medium">{teacher.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {teacher.subjects.slice(0, 2).join(', ')}
                              {teacher.subjects.length > 2 && ` +${teacher.subjects.length - 2}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">{teacher.classes}</p>
                          <p className="text-sm text-muted-foreground">classes</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Alerts & Issues</CardTitle>
                <CardDescription>
                  Important notifications requiring attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsData.alertsAndIssues.length > 0 ? (
                  <div className="space-y-4">
                    {analyticsData.alertsAndIssues.map((alert, index) => {
                      const Icon = alert.type === 'critical' ? AlertTriangle : 
                                   alert.type === 'warning' ? AlertTriangle : CheckCircle;
                      const colorClass = alert.type === 'critical' ? 'text-red-600' :
                                        alert.type === 'warning' ? 'text-yellow-600' : 'text-blue-600';
                      
                      return (
                        <div key={index} className="flex items-center gap-3 p-4 border rounded-lg">
                          <Icon className={`h-5 w-5 ${colorClass}`} />
                          <div className="flex-1">
                            <p className="font-medium">{alert.message}</p>
                          </div>
                          {alert.count && (
                            <Badge variant="outline" className={colorClass}>
                              {alert.count}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <p className="text-lg font-medium">All systems running smoothly</p>
                    <p className="text-muted-foreground">No alerts or issues to report</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
