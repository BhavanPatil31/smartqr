"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Header } from '@/components/Header';
import { ClassCard } from '@/components/ClassCard';
import { getPreviousStudentClasses, getAttendanceStatusForClasses } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { User, BookOpen, History, RefreshCw } from 'lucide-react';
import type { StudentProfile, Class } from '@/lib/data';

export default function StudentClassesPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/student/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchProfileAndClasses = async () => {
      if (!user) {
         setIsLoadingClasses(false);
         return;
      };

      setIsLoadingClasses(true);
      try {
        const docRef = doc(db, 'students', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const studentProfile = docSnap.data() as StudentProfile;
          setProfile(studentProfile);
          
          // Get classes that the student has previously attended
          const previousClasses = await getPreviousStudentClasses(user.uid);
          setClasses(previousClasses);
          
          // Get attendance status for these classes
          if (previousClasses.length > 0) {
            const classIds = previousClasses.map(cls => cls.id);
            const attendanceStatuses = await getAttendanceStatusForClasses(user.uid, classIds);
            setAttendanceStatus(attendanceStatuses);
          }
        } else {
            setProfile(null);
            setClasses([]);
            setAttendanceStatus({});
        }
      } catch (error) {
          console.error("Failed to fetch student data:", error);
          setClasses([]);
      } finally {
        setIsLoadingClasses(false);
      }
    };

    if (!loading) {
        fetchProfileAndClasses();
    }
  }, [user, loading]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
  };

  const handleRefresh = async () => {
    if (!user || classes.length === 0) return;
    
    setIsRefreshing(true);
    try {
      const classIds = classes.map(cls => cls.id);
      const attendanceStatuses = await getAttendanceStatusForClasses(user.uid, classIds);
      setAttendanceStatus(attendanceStatuses);
    } catch (error) {
      console.error("Failed to refresh attendance status:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading || isLoadingClasses) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <Header 
          onLogout={handleLogout} 
          user={user}
          userType="student"
          userProfile={profile}
        >
          <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-32" />
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
          <div className="grid gap-6 pt-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
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
        userType="student"
        userProfile={profile}
      />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" />
              My Classes
            </h1>
            <p className="text-muted-foreground mt-1">View previous classes you have attended and your attendance records.</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              disabled={isRefreshing || classes.length === 0}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Status'}
            </Button>
            <Button asChild variant="outline">
              <Link href="/student/attendance">
                <History className="mr-2 h-4 w-4" />
                Mark Attendance
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/student/history">
                <History className="mr-2 h-4 w-4" />
                Full History
              </Link>
            </Button>
          </div>
        </div>
        {classes.length > 0 ? (
          <div className="grid gap-6 pt-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {classes.map((classItem) => (
              <ClassCard 
                key={classItem.id} 
                classItem={classItem} 
                userRole="student" 
                hasAttendanceMarked={attendanceStatus[classItem.id] || false}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed shadow-sm mt-12 bg-card">
            <div className="flex flex-col items-center gap-1 text-center p-8">
              <h3 className="text-2xl font-bold tracking-tight">
                No classes attended yet
              </h3>
              <p className="text-sm text-muted-foreground">
                Classes will appear here once you start attending them. Use "Mark Attendance" to scan QR codes during live classes.
              </p>
              <div className="flex gap-2 mt-4">
                <Button asChild>
                  <Link href="/student/attendance"><History className="mr-2 h-4 w-4" /> Mark Attendance</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/student/profile"><User className="mr-2 h-4 w-4" /> Complete Profile</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
