"use client";

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { TeacherApprovalList } from '@/components/TeacherApprovalList';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { doc, onSnapshot } from 'firebase/firestore';
import type { AdminProfile } from '@/lib/data';

export default function AdminApprovalsPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [adminDept, setAdminDept] = useState<string | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/admin/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, 'admins', user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as AdminProfile;
        setAdminProfile(data);
        setAdminDept(data.department || null);
      } else {
        setAdminProfile(null);
        setAdminDept(null);
      }
    });
    return () => unsub();
  }, [user]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header 
        isAdmin={true} 
        user={user || undefined}
        userType="admin"
        userProfile={adminProfile}
        onLogout={handleLogout}
      />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-2xl">Teacher Approvals</h1>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
        <TeacherApprovalList adminId={user?.uid || ''} adminDept={adminDept || undefined} />
      </main>
    </div>
  );
}
