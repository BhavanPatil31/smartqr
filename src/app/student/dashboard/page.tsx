
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
import { User, QrCode } from 'lucide-react';
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
      if (user) {
        const docRef = doc(db, 'students', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const studentProfile = docSnap.data() as StudentProfile;
          setProfile(studentProfile);
          const studentClasses = await getStudentClasses(studentProfile.department, studentProfile.semester);
          setClasses(studentClasses);
        }
        setIsLoadingClasses(false);
      }
    };
    fetchProfileAndClasses();
  }, [user]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-24" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header>
         <div className="flex items-center gap-4">
            <Button asChild variant="outline">
                <Link href="/student/profile"><User className="mr-2 h-4 w-4" /> Profile</Link>
            </Button>
            <Button onClick={handleLogout} variant="outline">Logout</Button>
         </div>
      </Header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
          <h1 className="font-semibold font-headline text-lg md:text-2xl">Your Classes</h1>
           <Button asChild>
                <Link href="/student/scan"><QrCode className="mr-2 h-4 w-4" /> Scan QR</Link>
            </Button>
        </div>
         {isLoadingClasses ? (
           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : classes.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {classes.map((classItem) => (
              <ClassCard key={classItem.id} classItem={classItem} userRole="student" />
            ))}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
            <div className="flex flex-col items-center gap-1 text-center">
              <h3 className="text-2xl font-bold tracking-tight">
                No classes found
              </h3>
              <p className="text-sm text-muted-foreground">
                No classes match your department and semester.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
