
"use client";

import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { TeacherProfile } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { CreateClassForm } from '@/components/CreateClassForm';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateClassPage() {
  const [user, loading] = useAuthState(auth);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/teacher/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchTeacherProfile = async () => {
      if (user) {
        try {
          const teacherDoc = await getDoc(doc(db, 'teachers', user.uid));
          if (teacherDoc.exists()) {
            setTeacherProfile(teacherDoc.data() as TeacherProfile);
          }
        } catch (error) {
          console.error('Error fetching teacher profile:', error);
        }
      }
    };
    
    fetchTeacherProfile();
  }, [user]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
       <Header 
         onLogout={handleLogout} 
         user={user}
         userType="teacher"
         userProfile={teacherProfile}
       />
        <main className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
             <div className="mb-6">
                <Button asChild variant="ghost" className="-ml-4">
                    <Link href="/teacher/dashboard">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back
                    </Link>
                </Button>
                 <h1 className="text-2xl font-bold mt-2">Create New Class</h1>
             </div>
            <CreateClassForm />
        </main>
    </div>
  );
}
