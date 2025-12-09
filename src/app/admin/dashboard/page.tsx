
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, where, getDocs, getCountFromServer } from 'firebase/firestore';
import { Header } from '@/components/Header';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  BookOpen,
  Users,
  GraduationCap,
  Settings,
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Activity,
  Eye,
  UserCheck,
  ArrowRight,
  Calendar,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

import type { AdminProfile, Class, TeacherProfile, StudentProfile } from '@/lib/data';

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  pendingApprovals: number;
  todayAttendanceRate: number;
  activeQRCodes: number;
  recentActivity: Array<{
    type: 'class_created' | 'teacher_approved' | 'student_registered';
    message: string;
    time: string;
  }>;
}

export default function AdminDashboard() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/admin/login');
    }
  }, [user, loading, router]);

  // Fetch admin profile and dashboard stats
  useEffect(() => {
    if (!user) {
      setIsLoadingData(false);
      return;
    }

    const fetchDashboardData = async () => {
      setIsLoadingData(true);
      try {
        // Fetch admin profile
        const adminDoc = await getDocs(query(collection(db, 'admins'), where('__name__', '==', user.uid)));
        if (!adminDoc.empty) {
          const adminProfile = adminDoc.docs[0].data() as AdminProfile;
          setProfile(adminProfile);

          if (adminProfile.department) {
            // Fetch department statistics using optimized queries
            // 1. Students: Just count (biggest optimization)
            // 2. Teachers: Fetch all (small collection, complex logic for pending)
            // 3. Classes: Count total + Count active (optimized)

            const studentsQuery = query(collection(db, 'students'), where('department', '==', adminProfile.department));
            const teachersQuery = query(collection(db, 'teachers'), where('department', '==', adminProfile.department));
            const classesQuery = query(collection(db, 'classes'), where('department', '==', adminProfile.department));

            // For active QR codes, we use a query. Note: This requires an index on [department, qrCodeExpiresAt].
            // If index is missing, this might fail. But it's much faster than fetching all classes.
            const activeClassesQuery = query(
              collection(db, 'classes'),
              where('department', '==', adminProfile.department),
              where('qrCodeExpiresAt', '>', Date.now())
            );

            const [
              studentsCountSnap,
              teachersSnapshot,
              classesCountSnap,
              activeClassesCountSnap
            ] = await Promise.all([
              getCountFromServer(studentsQuery),
              getDocs(teachersQuery),
              getCountFromServer(classesQuery),
              getCountFromServer(activeClassesQuery).catch(e => {
                console.warn("Failed to count active classes (likely missing index). Falling back to 0.", e);
                return { data: () => ({ count: 0 }) };
              })
            ]);

            const teachers = teachersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as TeacherProfile));

            // Calculate stats
            const pendingApprovals = teachers.filter(t => t.isApproved !== true).length;

            // Use the count from server
            const activeQRCodes = activeClassesCountSnap.data().count;

            // Generate recent activity (placeholder)
            const recentActivity = [
              { type: 'class_created' as const, message: 'New class "Data Structures" created', time: '2 hours ago' },
              { type: 'teacher_approved' as const, message: 'Teacher John Doe approved', time: '4 hours ago' },
              { type: 'student_registered' as const, message: '5 new students registered', time: '1 day ago' }
            ];

            const dashboardStats: DashboardStats = {
              totalStudents: studentsCountSnap.data().count,
              totalTeachers: teachers.length,
              totalClasses: classesCountSnap.data().count,
              pendingApprovals,
              todayAttendanceRate: Math.random() * 30 + 70, // Placeholder
              activeQRCodes,
              recentActivity
            };

            setStats(dashboardStats);
          }
        } else {
          // User is not an admin or profile is missing
          console.log("Admin profile missing, redirecting to profile creation...");
          router.push('/admin/profile');
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchDashboardData();

    // Set up real-time listener for admin profile
    const docRef = doc(db, 'admins', user.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const adminProfile = docSnap.data() as AdminProfile;
        setProfile(adminProfile);
      }
    });

    return () => unsubscribe();
  }, [user]);


  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
  };

  if (loading || isLoadingData || !profile) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <Header>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </Header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <div className="flex items-center justify-between">
            <div className='space-y-2'>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-5 w-64" />
            </div>
          </div>
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
        userProfile={profile}
      />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl">Admin Dashboard</h1>
            <p className="text-muted-foreground text-lg">
              Welcome back, {profile.fullName.split(' ')[0]}! Managing {profile.department} Department
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4 animate-pulse text-green-600" />
            <span>Live Updates Active</span>
          </div>
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.totalStudents}</div>
                <p className="text-xs text-muted-foreground">
                  Registered in department
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Teachers</CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.totalTeachers}</div>
                <p className="text-xs text-muted-foreground">
                  Faculty members
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                <BookOpen className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{stats.totalClasses}</div>
                <p className="text-xs text-muted-foreground">
                  Across all semesters
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.pendingApprovals}</div>
                <p className="text-xs text-muted-foreground">
                  Teachers awaiting approval
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/classes')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg">Manage Classes</CardTitle>
                <CardDescription>
                  View and manage all department classes
                </CardDescription>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {stats?.totalClasses || 0} classes total
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/students')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg">Manage Students</CardTitle>
                <CardDescription>
                  View student records and attendance
                </CardDescription>
              </div>
              <GraduationCap className="h-8 w-8 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {stats?.totalStudents || 0} students enrolled
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/teachers')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg">Manage Teachers</CardTitle>
                <CardDescription>
                  View faculty and their subjects
                </CardDescription>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {stats?.totalTeachers || 0} faculty members
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/analytics')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg">Live Analytics</CardTitle>
                <CardDescription>
                  View real-time system insights
                </CardDescription>
              </div>
              <BarChart3 className="h-8 w-8 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Real-time data & reports
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/approvals')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg">Teacher Approvals</CardTitle>
                <CardDescription>
                  Review and approve new teachers
                </CardDescription>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {stats?.pendingApprovals || 0} pending approvals
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/settings')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg">System Settings</CardTitle>
                <CardDescription>
                  Configure system preferences
                </CardDescription>
              </div>
              <Settings className="h-8 w-8 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Admin configuration
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Status & Recent Activity */}
        {stats && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Live Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-green-600" />
                  Live System Status
                </CardTitle>
                <CardDescription>
                  Current system activity and metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                    <span className="font-medium">Active QR Codes</span>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    {stats.activeQRCodes} active
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Today's Attendance</span>
                  </div>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800">
                    {stats.todayAttendanceRate.toFixed(1)}%
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">System Status</span>
                  </div>
                  <Badge variant="outline" className="bg-purple-100 text-purple-800">
                    All systems operational
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest system events and updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentActivity.map((activity, index) => {
                    const Icon = activity.type === 'class_created' ? BookOpen :
                      activity.type === 'teacher_approved' ? CheckCircle : Users;
                    const colorClass = activity.type === 'class_created' ? 'text-blue-600' :
                      activity.type === 'teacher_approved' ? 'text-green-600' : 'text-purple-600';

                    return (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Icon className={`h-4 w-4 ${colorClass}`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.message}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
