
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Header } from '@/components/Header';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { User, LogOut, CheckSquare } from 'lucide-react';
import type { StudentProfile, Class, AttendanceRecord } from '@/lib/data';
import { getStudentAttendanceStats } from '@/lib/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AttendanceChart } from '@/components/AttendanceChart';

interface AttendanceStats {
  totalClasses: number;
  attendedClasses: number;
  missedClasses: number;
  attendanceRate: number;
}

export default function StudentDashboard() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/student/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchProfileAndStats = async () => {
      if (!user) {
         setIsLoadingData(false);
         return;
      };

      setIsLoadingData(true);
      try {
        const docRef = doc(db, 'students', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const studentProfile = docSnap.data() as StudentProfile;
          setProfile(studentProfile);
          
          if (studentProfile.department && studentProfile.semester) {
            const attendanceStats = await getStudentAttendanceStats(user.uid, studentProfile.department, studentProfile.semester);
            setStats(attendanceStats);
          } else {
            setStats({ totalClasses: 0, attendedClasses: 0, missedClasses: 0, attendanceRate: 0 });
          }
        } else {
            setProfile(null);
            setStats(null);
        }
      } catch (error) {
          console.error("Failed to fetch student data:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    if (!loading) {
        fetchProfileAndStats();
    }
  }, [user, loading]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
  };

  if (loading || isLoadingData) {
    return (
      <div className="flex min-h-screen w-full flex-col gradient-bg-dark">
        <Header>
          <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-40" />
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
          <div className="grid gap-6 pt-4 md:grid-cols-2 lg:grid-cols-3">
             <Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
             <Card className="lg:col-span-2"><CardHeader><Skeleton className="h-6 w-48" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col gradient-bg-dark">
      <Header>
         <div className="flex items-center gap-2">
            <Button asChild variant="default" size="sm">
                <Link href="/student/attendance"><CheckSquare className="mr-2 h-4 w-4" /> Mark Attendance</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
                <Link href="/student/profile"><User className="mr-2 h-4 w-4" /> Profile</Link>
            </Button>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
         </div>
      </Header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-2xl">Welcome, {profile?.fullName.split(' ')[0] || 'Student'}!</h1>
            <p className="text-muted-foreground">Here is your attendance overview.</p>
          </div>
        </div>
        
        {stats ? (
             <div className="grid gap-6 pt-4 md:grid-cols-2 lg:grid-cols-3">
                 <Card className="lg:col-span-2 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Attendance Rate</CardTitle>
                        <CardDescription>Your overall attendance percentage across all subjects.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[250px] md:h-[300px]">
                        <AttendanceChart attended={stats.attendedClasses} total={stats.totalClasses} />
                    </CardContent>
                 </Card>
                 <div className="space-y-6">
                    <Card className="bg-card/50 backdrop-blur-sm">
                        <CardHeader className="pb-2">
                           <CardTitle className="text-4xl font-bold">{stats.attendanceRate}%</CardTitle>
                           <CardDescription>Overall Rate</CardDescription>
                        </CardHeader>
                    </Card>
                    <Card className="bg-card/50 backdrop-blur-sm">
                        <CardHeader className="pb-2">
                           <CardTitle className="text-4xl font-bold">{stats.attendedClasses}</CardTitle>
                           <CardDescription>Classes Attended</CardDescription>
                        </CardHeader>
                    </Card>
                     <Card className="bg-card/50 backdrop-blur-sm">
                        <CardHeader className="pb-2">
                           <CardTitle className="text-4xl font-bold">{stats.missedClasses}</CardTitle>
                           <CardDescription>Classes Missed</CardDescription>
                        </CardHeader>
                    </Card>
                 </div>
            </div>
        ) : (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm mt-12 bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-1 text-center p-8">
                <h3 className="text-2xl font-bold tracking-tight">
                    No data to display
                </h3>
                <p className="text-sm text-muted-foreground">
                    Please complete your profile so we can calculate your attendance.
                </p>
                <Button asChild className="mt-4">
                    <Link href="/student/profile"><User className="mr-2 h-4 w-4" /> Go to Profile</Link>
                </Button>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}
