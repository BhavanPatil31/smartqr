
"use client";

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, User, MapPin } from 'lucide-react';
import type { Class } from '@/lib/data';

interface ClassCardProps {
  classItem: Class;
  userRole: 'student' | 'teacher';
}

export function ClassCard({ classItem, userRole }: ClassCardProps) {
  const href = `/${userRole}/class/${classItem.id}`;
  
  return (
    <Link href={href} className="group">
      <Card className="h-full flex flex-col bg-card border transition-all duration-300 ease-in-out hover:shadow-lg hover:border-primary/80 hover:-translate-y-1 rounded-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">{classItem.subject}</CardTitle>
          <CardDescription className="pt-1">{classItem.department} - {classItem.semester}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground flex-grow">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <span>{classItem.teacherName}</span>
          </div>
          {classItem.schedules?.map((schedule, index) => (
             <div key={index} className="flex flex-col space-y-2 pl-1">
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{schedule.day}, {schedule.startTime} - {schedule.endTime}</span>
                </div>
                 <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>Room: {schedule.roomNumber}</span>
                </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </Link>
  );
}
