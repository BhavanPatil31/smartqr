"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function TeacherPendingApproval() {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [isApproved, setIsApproved] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, 'teachers', user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const d = snap.data() as any;
        setIsApproved(Boolean(d.isApproved));
        if (d.isApproved) {
          router.replace('/teacher/dashboard');
        }
      }
    });
    return () => unsub();
  }, [user, router]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header />
      <main className="flex flex-1 items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Account Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your teacher account is awaiting admin approval. This page will update automatically when approved.
            </p>
            <div className="mt-6 flex gap-2">
              <Button onClick={() => router.refresh()} variant="outline">Refresh</Button>
              <Button onClick={() => router.push('/teacher/login')} variant="ghost">Back to Login</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}