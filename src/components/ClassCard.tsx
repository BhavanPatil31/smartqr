
"use client";

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Clock, User, MapPin } from 'lucide-react';
import type { Class } from '@/lib/data';

interface ClassCardProps {
  classItem: Class;
  userRole: 'student' | 'teacher';
}

export function ClassCard({ classItem, userRole }: ClassCardProps) {
  const href = `/${userRole}/class/${classItem.id}`;
  
  return (
    <Link href={href} className="group">
      <Card className="h-full flex flex-col bg-card/50 backdrop-blur-sm border-border/50 transition-all duration-300 ease-in-out hover:shadow-xl hover:border-primary/50 hover:-translate-y-2 hover:bg-card/80">
        <CardHeader>
          <CardTitle className="text-lg group-hover:text-primary transition-colors">{classItem.subject}</CardTitle>
          <CardDescription>{classItem.department} - {classItem.semester}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground flex-grow">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>{classItem.teacherName}</span>
          </div>
          {classItem.schedules?.map((schedule, index) => (
             <div key={index} className="flex flex-col space-y-1 pl-1 border-l-2 border-primary/20">
                <div className="flex items-center gap-2 pl-2">
                    <Clock className="h-4 w-4" />
                    <span>{schedule.day}, {schedule.startTime} - {schedule.endTime}</span>
                </div>
                 <div className="flex items-center gap-2 pl-2">
                    <MapPin className="h-4 w-4" />
                    <span>{schedule.roomNumber}</span>
                </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </Link>
  );
}
