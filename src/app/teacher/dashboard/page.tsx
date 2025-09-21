
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Header } from '@/components/Header';
import { ClassCard } from '@/components/ClassCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { User, PlusCircle, LogOut, Settings } from 'lucide-react';
import type { Class, TeacherProfile } from '@/lib/data';

export default function TeacherDashboard() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/teacher/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const checkApprovalStatus = async () => {
      if (user) {
        try {
          const teacherDoc = await getDoc(doc(db, 'teachers', user.uid));
          if (teacherDoc.exists()) {
            const teacherData = teacherDoc.data() as TeacherProfile;
            setTeacherProfile(teacherData);
            if (teacherData.isApproved === false) {
              router.push('/teacher/pending-approval');
            }
          }
        } catch (error) {
          console.error("Error checking approval status:", error);
        }
      }
    };
    
    checkApprovalStatus();
  }, [user, router]);

  useEffect(() => {
    if (user) {
      setIsLoadingClasses(true);
      const q = query(
        collection(db, 'classes'), 
        where('teacherId', '==', user.uid)
      );
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const classesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));
        setClasses(classesData);
        setIsLoadingClasses(false);
      }, (error) => {
        console.error("Error fetching classes:", error);
        setIsLoadingClasses(false);
      });
      return () => unsubscribe();
    } else if (!loading) {
      setIsLoadingClasses(false);
    }
  }, [user, loading]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
  };

  if (loading || isLoadingClasses || !user) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <Header>
           <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
          </div>
        </Header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(3)].map((_,i) => <Skeleton key={i} className="h-48 w-full" />)}
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
        userType="teacher"
        userProfile={teacherProfile}
      />
      <main className="flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-2xl">Your Classes</h1>
              <p className="text-muted-foreground">Manage your existing classes or create a new one.</p>
            </div>
            <Button asChild>
                <Link href="/teacher/create-class">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Class
                </Link>
            </Button>
        </div>
        {classes.length > 0 ? (
          <div className="grid gap-6 pt-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {classes.map((classItem) => (
              <ClassCard key={classItem.id} classItem={classItem} userRole="teacher" />
            ))}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm mt-12 bg-card min-h-[400px]">
            <div className="flex flex-col items-center gap-2 text-center p-8">
              <h3 className="text-2xl font-bold tracking-tight">
                No classes created yet
              </h3>
              <p className="text-sm text-muted-foreground">
                Get started by creating your first class.
              </p>
              <Button asChild className="mt-4">
                  <Link href="/teacher/create-class">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create Class
                  </Link>
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
