
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Clock } from 'lucide-react';
import type { Class, TeacherProfile } from '@/lib/data';
import { getTeacherById } from '@/lib/data';
import { Skeleton } from './ui/skeleton';

interface ClassCardProps {
  classItem: Class;
  userRole: 'student' | 'teacher';
}

export function ClassCard({ classItem, userRole }: ClassCardProps) {
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const href = `/${userRole}/class/${classItem.id}`;
  
  useEffect(() => {
    const fetchTeacher = async () => {
      const teacherData = await getTeacherById(classItem.teacherId);
      setTeacher(teacherData);
      setLoading(false);
    };
    fetchTeacher();
  }, [classItem.teacherId]);

  return (
    <Link href={href}>
      <Card className="hover:shadow-lg transition-shadow h-full flex flex-col bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-headline">{classItem.subject}</CardTitle>
          <CardDescription>Semester {classItem.semester} - {classItem.department}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground flex-grow">
          {loading ? (
            <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>{teacher?.fullName || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{classItem.timeSlot.day}, {classItem.timeSlot.start} - {classItem.timeSlot.end}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
