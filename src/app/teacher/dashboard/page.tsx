
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Header } from '@/components/Header';
import { ClassCard } from '@/components/ClassCard';
import { getTeacherClasses } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { User, PlusCircle } from 'lucide-react';
import { CreateClassDialog } from '@/components/CreateClassDialog';
import type { Class } from '@/lib/data';

export default function TeacherDashboard() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isCreateClassOpen, setCreateClassOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/teacher/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const classesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));
        setClasses(classesData);
        setIsLoadingClasses(false);
      });
      return () => unsubscribe();
    }
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
        <div className="flex items-center justify-between">
          <h1 className="font-semibold font-headline text-lg md:text-2xl">Your Classes</h1>
          <CreateClassDialog open={isCreateClassOpen} onOpenChange={setCreateClassOpen}>
             <Button onClick={() => setCreateClassOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Class
             </Button>
          </CreateClassDialog>
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
              <ClassCard key={classItem.id} classItem={classItem} userRole="teacher" />
            ))}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm mt-8">
            <div className="flex flex-col items-center gap-1 text-center">
              <h3 className="text-2xl font-bold tracking-tight">
                No classes created yet
              </h3>
              <p className="text-sm text-muted-foreground">
                Click "Create Class" to get started.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
