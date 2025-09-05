"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { Header } from '@/components/Header';
import { ClassCard } from '@/components/ClassCard';
import { getStudentClasses } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function StudentDashboard() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/student/login');
    }
    if (user) {
      // In a real app, you would fetch classes for the logged-in user
      // For now, we'll continue using the mock data
      setClasses(getStudentClasses());
    }
  }, [user, loading, router]);

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
         <Button onClick={handleLogout} variant="outline">Logout</Button>
      </Header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center">
          <h1 className="font-semibold font-headline text-lg md:text-2xl">Your Classes</h1>
        </div>
        {classes.length > 0 ? (
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
                There are currently no classes available for you.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
