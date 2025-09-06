
"use client";

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Clock, User } from 'lucide-react';
import type { Class } from '@/lib/data';

interface ClassCardProps {
  classItem: Class;
  userRole: 'student' | 'teacher';
}

export function ClassCard({ classItem, userRole }: ClassCardProps) {
  const href = `/${userRole}/class/${classItem.id}`;
  
  return (
    <Link href={href} className="group">
      <Card className="hover:shadow-lg transition-shadow duration-300 h-full flex flex-col bg-card/50 backdrop-blur-sm hover:border-primary">
        <CardHeader>
          <CardTitle className="text-lg group-hover:text-primary transition-colors">{classItem.subject}</CardTitle>
          <CardDescription>{classItem.department} - {classItem.semester}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground flex-grow">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
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
