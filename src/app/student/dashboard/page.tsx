
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, onSnapshot, query, where, collectionGroup } from 'firebase/firestore';
import { format, formatDistanceToNow } from 'date-fns';
import { Header } from '@/components/Header';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  User, 
  LogOut, 
  CheckSquare, 
  History, 
  TrendingUp, 
  Calendar, 
  Clock, 
  BookOpen,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Target,
  Award,
  BarChart3,
  Activity,
  Zap,
  Bell,
  Eye,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Minus,
  Settings
} from 'lucide-react';
import type { StudentProfile } from '@/lib/data';
import { calculateStudentAttendanceStats, type AttendanceStats, getCorrectStudentAttendanceRecords, calculateStudentHistory } from '@/lib/client-stats';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AttendanceChart } from '@/components/AttendanceChart';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubjectWiseAttendance } from '@/components/SubjectWiseAttendance';


export default function StudentDashboard() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [liveStats, setLiveStats] = useState<{
    todayAttended: number;
    todayTotal: number;
    weekTrend: 'up' | 'down' | 'stable';
    weekChange: number;
  } | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [subjectStats, setSubjectStats] = useState<any[]>([]);
  const [isNewAttendanceDetected, setIsNewAttendanceDetected] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/student/login');
    }
  }, [user, loading, router]);

  const refreshData = useCallback(async () => {
    if (!user) return;
    
    setIsRefreshing(true);
    try {
      const docRef = doc(db, 'students', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const studentProfile = docSnap.data() as StudentProfile;
        setProfile(studentProfile);
        
        const profileComplete = !!(studentProfile.department && studentProfile.semester);
        setIsProfileComplete(profileComplete);

        if (profileComplete) {
          // Store previous stats to detect changes
          const previousAttendedCount = stats?.attendedClasses || 0;
          
          const attendanceStats = await calculateStudentAttendanceStats(user.uid);
          setStats(attendanceStats);
          
          // Detect new attendance
          if (attendanceStats.attendedClasses > previousAttendedCount) {
            setIsNewAttendanceDetected(true);
            // Clear the indicator after 5 seconds
            setTimeout(() => setIsNewAttendanceDetected(false), 5000);
          }
          
          // Calculate live stats for today
          const today = new Date().toISOString().split('T')[0];
          const todayStats = await calculateTodayStats(user.uid, today);
          setLiveStats(todayStats);
          
          // Get recent activity
          const activity = await getRecentActivity(user.uid);
          setRecentActivity(activity);
          
          // Generate notifications
          const newNotifications = generateNotifications(attendanceStats, todayStats);
          setNotifications(newNotifications);
          
          // Get subject-wise stats
          const historyData = await calculateStudentHistory(user.uid);
          setSubjectStats(historyData.subjectStats || []);
        } else {
          setStats(null);
          setLiveStats(null);
          setRecentActivity([]);
          setNotifications([]);
        }
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Failed to refresh student data:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [user, stats?.attendedClasses]);

  // Real-time listener for attendance records - Simplified to avoid permission issues
  useEffect(() => {
    if (!user || !isProfileComplete || !profile) return;

    const unsubscribers: (() => void)[] = [];

    // Listen to the student document for changes
    const studentUnsubscribe = onSnapshot(
      doc(db, 'students', user.uid),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          refreshData();
        }
      },
      (error) => {
        console.error('Real-time listener error:', error);
        setIsLiveMode(false);
      }
    );
    unsubscribers.push(studentUnsubscribe);

    // Use collection group query to listen to student's own attendance records
    // This is more efficient and avoids permission issues
    try {
      const attendanceQuery = query(
        collectionGroup(db, 'records'),
        where('studentId', '==', user.uid)
      );

      const attendanceUnsubscribe = onSnapshot(attendanceQuery, (snapshot) => {
        // Check if any new records were added today
        const today = new Date().toISOString().split('T')[0];
        const todayRecords = snapshot.docs.filter(doc => {
          const data = doc.data() as any;
          const recordDate = new Date(data.timestamp).toISOString().split('T')[0];
          return recordDate === today;
        });

        if (todayRecords.length > 0) {
          console.log('Attendance record updated - refreshing dashboard');
          refreshData();
        }
      }, (error) => {
        console.error('Attendance listener error:', error);
        // Fallback to periodic refresh if real-time fails
        setIsLiveMode(false);
      });

      unsubscribers.push(attendanceUnsubscribe);
    } catch (error) {
      console.error('Failed to set up attendance listener:', error);
      setIsLiveMode(false);
    }

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [user, isProfileComplete, profile, refreshData]);

  useEffect(() => {
    const fetchProfileAndStats = async () => {
      if (!user) {
         setIsLoadingData(false);
         return;
      };

      setIsLoadingData(true);
      await refreshData();
      setIsLoadingData(false);
    };

    if (!loading && user) {
        fetchProfileAndStats();
    }
  }, [user, loading]);

  // Real-time updates every 5 seconds when live mode is enabled (faster for immediate feedback)
  // Auto-refresh removed - dashboard now only updates via real-time listeners

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
  };

  const getAttendanceStatus = (rate: number) => {
    if (rate >= 90) return { status: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-50', icon: Award };
    if (rate >= 75) return { status: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: CheckCircle2 };
    if (rate >= 60) return { status: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: AlertCircle };
    return { status: 'Poor', color: 'text-red-600', bgColor: 'bg-red-50', icon: XCircle };
  };

  // Helper functions for live data
  const calculateTodayStats = async (studentId: string, today: string) => {
    try {
      const { records } = await getCorrectStudentAttendanceRecords(studentId);
      const todayRecords = records.filter(record => 
        new Date(record.timestamp).toISOString().split('T')[0] === today
      );
      
      // Get student profile to determine their classes
      const studentDocRef = doc(db, 'students', studentId);
      const studentDocSnap = await getDoc(studentDocRef);
      
      let totalClassesToday = 0;
      if (studentDocSnap.exists()) {
        const studentProfile = studentDocSnap.data() as StudentProfile;
        if (studentProfile.department && studentProfile.semester) {
          // Get today's day of week
          const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });
          
          // Query classes for this student's department and semester
          const classesQuery = query(
            collection(db, 'classes'),
            where('department', '==', studentProfile.department),
            where('semester', '==', studentProfile.semester)
          );
          
          const classesSnapshot = await getDocs(classesQuery);
          
          // Count classes scheduled for today
          classesSnapshot.docs.forEach((doc: any) => {
            const classData = doc.data();
            if (classData.schedules) {
              const todaySchedules = classData.schedules.filter((schedule: any) => 
                schedule.day === dayOfWeek
              );
              totalClassesToday += todaySchedules.length;
            }
          });
        }
      }
      
      // Calculate week trend based on recent attendance
      const lastWeekRecords = records.filter(record => {
        const recordDate = new Date(record.timestamp);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return recordDate >= weekAgo;
      });
      
      const thisWeekRecords = lastWeekRecords.filter(record => {
        const recordDate = new Date(record.timestamp);
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        return recordDate >= weekStart;
      });
      
      const lastWeekCount = lastWeekRecords.length - thisWeekRecords.length;
      const thisWeekCount = thisWeekRecords.length;
      
      let weekTrend: 'up' | 'down' | 'stable' = 'stable';
      let weekChange = 0;
      
      if (lastWeekCount > 0) {
        weekChange = Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100);
        if (weekChange > 5) weekTrend = 'up';
        else if (weekChange < -5) weekTrend = 'down';
        weekChange = Math.abs(weekChange);
      }
      
      return {
        todayAttended: todayRecords.length,
        todayTotal: totalClassesToday || 0,
        weekTrend,
        weekChange
      };
    } catch (error) {
      console.error('Error calculating today stats:', error);
      return {
        todayAttended: 0,
        todayTotal: 0,
        weekTrend: 'stable' as const,
        weekChange: 0
      };
    }
  };

  const getRecentActivity = async (studentId: string) => {
    try {
      const { records } = await getCorrectStudentAttendanceRecords(studentId);
      return records
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5)
        .map(record => ({
          subject: record.subject || 'Unknown Subject',
          timestamp: new Date(record.timestamp),
          action: 'attended'
        }));
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return [];
    }
  };

  const generateNotifications = (stats: AttendanceStats | null, liveStats: any) => {
    const notifications: string[] = [];
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    
    // Priority notification for new attendance
    if (isNewAttendanceDetected) {
      notifications.unshift(`🎉 Attendance marked successfully! Your stats have been updated.`);
    }
    
    if (stats) {
      if (stats.attendanceRate < 75) {
        notifications.push(`⚠️ Your attendance is ${stats.attendanceRate.toFixed(1)}%. Consider improving to maintain 75%+`);
      }
      if (stats.attendanceRate >= 90) {
        notifications.push(`🎉 Excellent! You have ${stats.attendanceRate.toFixed(1)}% attendance`);
      }
    }
    
    if (liveStats) {
      if (liveStats.todayAttended === liveStats.todayTotal && liveStats.todayTotal > 0) {
        notifications.push(`✅ Perfect attendance today! All ${liveStats.todayTotal} classes attended`);
      } else if (liveStats.todayAttended === 0 && liveStats.todayTotal > 0) {
        notifications.push(`📚 ${liveStats.todayTotal} classes scheduled today. Don't miss out!`);
      } else if (liveStats.todayAttended > 0 && liveStats.todayAttended < liveStats.todayTotal) {
        const remaining = liveStats.todayTotal - liveStats.todayAttended;
        notifications.push(`📝 ${remaining} more class${remaining > 1 ? 'es' : ''} remaining today`);
      }
      
      // Time-based notifications
      if (currentHour >= 8 && currentHour <= 17 && liveStats.todayTotal > 0) {
        notifications.push(`🕐 Class hours are active. Stay alert for attendance!`);
      }
    }
    
    // Add connection status notification
    if (!isLiveMode) {
      notifications.push(`🔌 Live mode is disabled. Enable for real-time updates during class.`);
    } else {
      notifications.push(`🔴 Live mode active - Updates every 10 seconds`);
    }
    
    return notifications;
  };

  if (loading || isLoadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Header>
           <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
          </div>
        </Header>
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className='space-y-2'>
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-6 w-80" />
              </div>
              <Skeleton className="h-10 w-40" />
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              <Skeleton className="h-80 w-full" />
              <Skeleton className="h-80 w-full" />
              <Skeleton className="h-80 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  const attendanceStatus = stats ? getAttendanceStatus(stats.attendanceRate) : null;
  const StatusIcon = attendanceStatus?.icon || AlertCircle;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header 
        onLogout={handleLogout} 
        user={user}
        userType="student"
        userProfile={profile}
      />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Welcome back, {profile?.fullName.split(' ')[0] || 'Student'}! 👋
                </h1>
                {isLiveMode && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 animate-pulse">
                    <Activity className="h-3 w-3 mr-1" />
                    LIVE
                  </Badge>
                )}
                {isNewAttendanceDetected && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 animate-bounce">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    NEW ATTENDANCE!
                  </Badge>
                )}
              </div>
              <p className="text-slate-600 text-lg">
                Here's your comprehensive attendance overview
              </p>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Last updated: {formatDistanceToNow(lastUpdated, { addSuffix: true })}
                </div>
                {liveStats && (
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Today: {liveStats.todayAttended}/{liveStats.todayTotal} classes
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => setIsLiveMode(!isLiveMode)} 
                variant={isLiveMode ? "default" : "outline"} 
                size="sm"
                className={`gap-2 ${isLiveMode ? 'bg-green-600 hover:bg-green-700 animate-pulse' : ''}`}
              >
                <Activity className={`h-4 w-4 ${isLiveMode ? 'animate-pulse' : ''}`} />
                {isLiveMode ? '🔴 Live Mode' : 'Enable Live'}
              </Button>
              <Button 
                onClick={refreshData} 
                variant="outline" 
                size="sm"
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {isProfileComplete && (
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <Link href="/student/history">
                    <BarChart3 className="h-4 w-4" />
                    Detailed History
                  </Link>
                </Button>
              )}
            </div>
          </div>
          
          {/* Notifications */}
          {notifications.length > 0 && (
            <div className="mt-4 space-y-2">
              {notifications.map((notification, index) => (
                <Alert key={index} className="border-blue-200 bg-blue-50">
                  <Bell className="h-4 w-4" />
                  <AlertDescription className="text-blue-800">
                    {notification}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </div>
        
        {isProfileComplete && stats ? (
          <div className="space-y-8">
            {/* Live Analytics Section */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="subjects">Subjects</TabsTrigger>
                <TabsTrigger value="live">Live Data</TabsTrigger>
                <TabsTrigger value="trends">Trends</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6">
                {/* Main Stats Grid */}
                <div className="grid gap-6 lg:grid-cols-3">
              {/* Attendance Overview Card */}
              <Card className={`lg:col-span-2 border-0 shadow-lg bg-white/80 backdrop-blur-sm ${isNewAttendanceDetected ? 'ring-2 ring-green-400 animate-pulse' : ''}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className={`text-2xl font-bold flex items-center gap-2 ${isNewAttendanceDetected ? 'animate-bounce' : ''}`}>
                        <Target className="h-6 w-6 text-blue-600" />
                        Attendance Overview
                        {isNewAttendanceDetected && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 animate-pulse ml-2">
                            UPDATED!
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-base mt-2">
                        Your overall performance across all subjects
                      </CardDescription>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`${attendanceStatus?.color} ${attendanceStatus?.bgColor} border-current ${isNewAttendanceDetected ? 'animate-bounce' : ''}`}
                    >
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {attendanceStatus?.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="h-64">
                    <AttendanceChart attended={stats.attendedClasses} total={stats.totalClasses} />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">Progress to 75% target</span>
                      <span className="text-sm font-medium text-slate-600">{stats.attendanceRate}%</span>
                    </div>
                    <Progress 
                      value={Math.min(stats.attendanceRate, 100)} 
                      className="h-2"
                    />
                    <p className="text-xs text-slate-500">
                      {stats.attendanceRate < 75 
                        ? `You need ${Math.ceil((75 * stats.totalClasses - stats.attendedClasses * 100) / 100)} more classes to reach 75%`
                        : 'Great job! You\'ve maintained good attendance.'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="space-y-6">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600">Overall Rate</p>
                        <p className="text-3xl font-bold text-blue-900">{stats.attendanceRate}%</p>
                      </div>
                      <div className="p-3 bg-blue-200 rounded-full">
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={`border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 ${isNewAttendanceDetected ? 'ring-2 ring-green-400 animate-pulse' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-600">Classes Attended</p>
                        <p className={`text-3xl font-bold text-green-900 ${isNewAttendanceDetected ? 'animate-bounce' : ''}`}>{stats.attendedClasses}</p>
                      </div>
                      <div className={`p-3 bg-green-200 rounded-full ${isNewAttendanceDetected ? 'animate-spin' : ''}`}>
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-red-600">Classes Missed</p>
                        <p className="text-3xl font-bold text-red-900">{stats.missedClasses}</p>
                      </div>
                      <div className="p-3 bg-red-200 rounded-full">
                        <XCircle className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Additional Info Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 rounded-full">
                      <BookOpen className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Total Classes</p>
                      <p className="text-2xl font-bold text-slate-900">{stats.totalClasses}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-100 rounded-full">
                      <Calendar className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Department</p>
                      <p className="text-lg font-semibold text-slate-900">{profile?.department}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 rounded-full">
                      <Award className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Semester</p>
                      <p className="text-lg font-semibold text-slate-900">{profile?.semester}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
              </TabsContent>
              
              <TabsContent value="subjects" className="space-y-6">
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      Subject-wise Attendance
                    </CardTitle>
                    <CardDescription>
                      Your attendance percentage for each subject this semester
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {subjectStats && subjectStats.length > 0 ? (
                      <SubjectWiseAttendance stats={subjectStats} />
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No subject data available</p>
                        <p className="text-sm">Subject-wise attendance will appear here once you start attending classes</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <div className="flex justify-center">
                  <Button asChild variant="outline" size="lg" className="gap-2">
                    <Link href="/student/history">
                      <BarChart3 className="h-4 w-4" />
                      View Detailed History & Records
                    </Link>
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="live" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <Card className={`border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 ${isNewAttendanceDetected ? 'ring-2 ring-blue-400 animate-pulse' : ''}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600">Today's Attendance</p>
                          <p className={`text-3xl font-bold text-blue-900 ${isNewAttendanceDetected ? 'animate-bounce' : ''}`}>
                            {liveStats ? `${liveStats.todayAttended}/${liveStats.todayTotal}` : '0/0'}
                          </p>
                          <p className="text-xs text-blue-700 mt-1">
                            {liveStats && liveStats.todayTotal > 0 
                              ? `${Math.round((liveStats.todayAttended / liveStats.todayTotal) * 100)}% completed`
                              : liveStats && liveStats.todayTotal === 0 
                                ? 'No classes scheduled'
                                : 'Loading...'
                            }
                          </p>
                        </div>
                        <div className={`p-3 bg-blue-200 rounded-full ${isNewAttendanceDetected ? 'animate-spin' : ''}`}>
                          <Calendar className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-600">Week Trend</p>
                          <div className="flex items-center gap-2">
                            {liveStats?.weekTrend === 'up' && <ArrowUp className="h-4 w-4 text-green-600" />}
                            {liveStats?.weekTrend === 'down' && <ArrowDown className="h-4 w-4 text-red-600" />}
                            {liveStats?.weekTrend === 'stable' && <Minus className="h-4 w-4 text-gray-600" />}
                            <p className="text-2xl font-bold text-green-900">
                              {liveStats?.weekChange || 0}%
                            </p>
                          </div>
                          <p className="text-xs text-green-700 mt-1">vs last week</p>
                        </div>
                        <div className="p-3 bg-green-200 rounded-full">
                          <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-600">Live Status</p>
                          <p className="text-2xl font-bold text-purple-900">
                            {isLiveMode ? 'Active' : 'Offline'}
                          </p>
                          <p className="text-xs text-purple-700 mt-1">
                            {isLiveMode ? 'Real-time updates' : 'Manual refresh only'}
                          </p>
                        </div>
                        <div className="p-3 bg-purple-200 rounded-full">
                          <Activity className="h-6 w-6 text-purple-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-orange-600">Last Update</p>
                          <p className="text-lg font-bold text-orange-900">
                            {lastUpdated.toLocaleTimeString()}
                          </p>
                          <p className="text-xs text-orange-700 mt-1">
                            {isRefreshing ? 'Updating...' : 'Ready'}
                          </p>
                        </div>
                        <div className="p-3 bg-orange-200 rounded-full">
                          <Clock className="h-6 w-6 text-orange-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="trends" className="space-y-6">
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      Attendance Trends
                    </CardTitle>
                    <CardDescription>
                      Track your attendance performance over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Trend analysis coming soon...</p>
                        <p className="text-sm">This will show your weekly and monthly attendance patterns</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="activity" className="space-y-6">
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-green-600" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>
                      Your latest attendance records and actions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentActivity.length > 0 ? (
                      <div className="space-y-4">
                        {recentActivity.map((activity, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                            <div className="p-2 bg-green-100 rounded-full">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-slate-900">{activity.subject}</p>
                              <p className="text-sm text-slate-600">
                                Attended on {activity.timestamp.toLocaleDateString()} at {activity.timestamp.toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No recent activity</p>
                        <p className="text-sm">Your attendance records will appear here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-12">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="p-6 bg-slate-100 rounded-full">
                  {isProfileComplete ? (
                    <AlertCircle className="h-12 w-12 text-slate-400" />
                  ) : (
                    <User className="h-12 w-12 text-slate-400" />
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-slate-900">
                    {isProfileComplete ? "No Data Available" : "Complete Your Profile"}
                  </h3>
                  <p className="text-slate-600 max-w-md">
                    {isProfileComplete 
                      ? "There is no attendance data to display for your classes yet. Check back later or contact your teacher."
                      : "Please provide your department and semester information to view your attendance data and start tracking your progress."}
                  </p>
                </div>
                {!isProfileComplete && (
                  <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                    <Link href="/student/profile">
                      <User className="mr-2 h-5 w-5" /> 
                      Complete Profile
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
