
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Header } from '@/components/Header';
import { ClassCard } from '@/components/ClassCard';
import { getStudentClasses } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { User, LogOut } from 'lucide-react';
import type { StudentProfile, Class } from '@/lib/data';

export default function StudentAttendancePage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);

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
          
          if (studentProfile.department && studentProfile.semester) {
            const studentClasses = await getStudentClasses(studentProfile.department, studentProfile.semester);
            setClasses(studentClasses);
          } else {
            setClasses([]);
          }
        } else {
            setProfile(null);
            setClasses([]);
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

  if (loading || isLoadingClasses) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Header>
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
    <div className="flex min-h-screen w-full flex-col">
      <Header>
          <Button asChild variant="ghost" size="sm">
              <Link href="/student/dashboard">Dashboard</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
              <Link href="/student/profile"><User className="mr-2 h-4 w-4" /> Profile</Link>
          </Button>
          <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
          </Button>
      </Header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl">Mark Attendance</h1>
            <p className="text-muted-foreground mt-1">Select a class to scan the QR code and mark your attendance.</p>
          </div>
        </div>
        {classes.length > 0 ? (
          <div className="grid gap-6 pt-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {classes.map((classItem) => (
              <ClassCard key={classItem.id} classItem={classItem} userRole="student" />
            ))}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed shadow-sm mt-12 bg-card/50">
            <div className="flex flex-col items-center gap-1 text-center p-8">
              <h3 className="text-2xl font-bold tracking-tight">
                No classes found
              </h3>
              <p className="text-sm text-muted-foreground">
                Please complete your profile or check if classes have been assigned.
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
