
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Clock } from 'lucide-react';
import type { Class } from '@/lib/data';

interface ClassCardProps {
  classItem: Class;
  userRole: 'student' | 'teacher';
}

export function ClassCard({ classItem, userRole }: ClassCardProps) {
  const href = `/${userRole}/class/${classItem.id}`;
  
  return (
    <Link href={href}>
      <Card className="hover:shadow-lg transition-shadow h-full flex flex-col bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-headline">{classItem.subject}</CardTitle>
          <CardDescription>Semester {classItem.semester} - {classItem.department}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground flex-grow">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>{classItem.teacherName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{classItem.timeSlot.day}, {classItem.timeSlot.start} - {classItem.timeSlot.end}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
