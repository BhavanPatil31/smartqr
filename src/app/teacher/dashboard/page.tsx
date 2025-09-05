"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { Header } from '@/components/Header';
import { ClassCard } from '@/components/ClassCard';
import { getTeacherClasses } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { User } from 'lucide-react';

export default function TeacherDashboard() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/teacher/login');
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
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </main>
      </div>
    );
  }

  // Assuming a logged-in teacher with ID 'T1'
  const classes = getTeacherClasses('T1');

  return (
    <div className="flex min-h-screen w-full flex-col">
       <Header>
         <div className="flex items-center gap-4">
            <Button asChild variant="outline">
                <Link href="/teacher/profile"><User className="mr-2 h-4 w-4" /> Profile</Link>
            </Button>
            <Button onClick={handleLogout} variant="outline">Logout</Button>
         </div>
      </Header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center">
          <h1 className="font-semibold font-headline text-lg md:text-2xl">Your Classes</h1>
        </div>
        {classes.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {classes.map((classItem) => (
              <ClassCard key={classItem.id} classItem={classItem} userRole="teacher" />
            ))}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
            <div className="flex flex-col items-center gap-1 text-center">
              <h3 className="text-2xl font-bold tracking-tight">
                No classes assigned
              </h3>
              <p className="text-sm text-muted-foreground">
                You have not been assigned to any classes yet.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
