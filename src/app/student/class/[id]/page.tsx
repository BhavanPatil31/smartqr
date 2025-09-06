
"use client";

import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { ClassAttendanceScanner } from '@/components/ClassAttendanceScanner';
import { getClassById } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, User, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Class } from '@/lib/data';


export default function StudentClassPage() {
  const params = useParams();
  const classId = params.id as string;

  const [classItem, setClassItem] = useState<Class | null>(null);
  const [loading, setLoading] = useState(true);

   useEffect(() => {
    if (!classId) return;

    const fetchClassData = async () => {
      setLoading(true);
      const fetchedClass = await getClassById(classId);
      setClassItem(fetchedClass);
      setLoading(false);
    };

    fetchClassData();
  }, [classId]);

   if (loading) {
    return (
       <div className="flex min-h-screen w-full flex-col gradient-bg-dark">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl space-y-4">
                <Skeleton className="h-10 w-48" />
                <Card className="w-full">
                    <CardHeader>
                        <Skeleton className="h-8 w-3/4 mx-auto" />
                    </CardHeader>
                    <CardContent className="flex flex-col items-center space-y-6 pt-6">
                        <div className="space-y-2 text-center w-full">
                            <Skeleton className="h-5 w-1/2 mx-auto" />
                            <Skeleton className="h-5 w-2/3 mx-auto" />
                        </div>
                         <Skeleton className="h-48 w-full max-w-md" />
                    </CardContent>
                </Card>
            </div>
        </main>
      </div>
    );
  }

  if (!classItem) {
    notFound();
  }

  return (
    <div className="flex min-h-screen w-full flex-col gradient-bg-dark">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <Button asChild variant="ghost" className="mb-4">
              <Link href="/student/dashboard"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
          </Button>
          <Card className="w-full gradient-card-1">
            <CardHeader>
              <CardTitle className="text-2xl text-center font-headline">{classItem.subject}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-6 pt-6">
              <div className="text-muted-foreground space-y-2 text-center">
                <p className="flex items-center justify-center gap-2"><User className="h-4 w-4" /> {classItem.teacherName}</p>
                <p className="flex items-center justify-center gap-2"><Clock className="h-4 w-4" /> {classItem.timeSlot.day}, {classItem.timeSlot.start} - {classItem.timeSlot.end}</p>
              </div>
              <ClassAttendanceScanner classItem={classItem} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
