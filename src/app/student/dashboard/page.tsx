
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
import { User, QrCode, LogOut } from 'lucide-react';
import type { StudentProfile, Class } from '@/lib/data';

export default function StudentDashboard() {
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
      setIsLoadingClasses(true);
      if (user) {
        const docRef = doc(db, 'students', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const studentProfile = docSnap.data() as StudentProfile;
          setProfile(studentProfile);
          const studentClasses = await getStudentClasses(studentProfile.department, studentProfile.semester);
          setClasses(studentClasses);
        }
      }
      setIsLoadingClasses(false);
    };

    if (!loading) {
        fetchProfileAndClasses();
    }
  }, [user, loading]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
  };

  if (loading || !profile || isLoadingClasses) {
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
            <Skeleton className="h-10 w-36" />
          </div>
          <div className="grid gap-6 pt-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header>
         <div className="flex items-center gap-2">
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
            <h1 className="font-bold text-2xl">Welcome, {profile.fullName.split(' ')[0]}!</h1>
            <p className="text-muted-foreground">Here are the classes for your semester.</p>
          </div>
           <Button asChild>
                <Link href="/student/scan"><QrCode className="mr-2 h-4 w-4" /> Scan QR Code</Link>
            </Button>
        </div>
         {isLoadingClasses ? (
           <div className="grid gap-6 pt-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : classes.length > 0 ? (
          <div className="grid gap-6 pt-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {classes.map((classItem) => (
              <ClassCard key={classItem.id} classItem={classItem} userRole="student" />
            ))}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm mt-12">
            <div className="flex flex-col items-center gap-1 text-center p-8">
              <h3 className="text-2xl font-bold tracking-tight">
                No classes found
              </h3>
              <p className="text-sm text-muted-foreground">
                There are currently no classes scheduled for your department and semester.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
