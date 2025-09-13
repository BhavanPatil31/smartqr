
"use client";

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, User, MapPin, Edit, Trash2 } from 'lucide-react';
import type { Class } from '@/lib/data';
import { Button } from './ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteClassAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { formatTime } from '@/lib/utils';


interface ClassCardProps {
  classItem: Class;
  userRole: 'student' | 'teacher';
}

export function ClassCard({ classItem, userRole }: ClassCardProps) {
  const href = `/${userRole}/class/${classItem.id}`;
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = async () => {
    try {
      await deleteClassAction(classItem.id);
      toast({
        title: "Class Deleted",
        description: `The class "${classItem.subject}" has been successfully deleted.`,
      });
    } catch (error) {
      console.error("Failed to delete class:", error);
      toast({
        title: "Error",
        description: "Could not delete the class. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
      <Card className="h-full flex flex-col bg-card border transition-all duration-300 ease-in-out hover:shadow-lg hover:border-primary/80 rounded-xl">
        <Link href={href} className="group flex-grow">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">{classItem.subject}</CardTitle>
            <CardDescription className="pt-1">{classItem.department} - {classItem.semester}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <span>{classItem.teacherName}</span>
            </div>
            {classItem.schedules?.map((schedule, index) => (
              <div key={index} className="flex flex-col space-y-2 pl-1">
                  <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>{schedule.day}, {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>Room: {schedule.roomNumber}</span>
                  </div>
              </div>
            ))}
          </CardContent>
        </Link>
        {userRole === 'teacher' && (
          <CardFooter className="p-4 border-t">
              <div className="flex w-full justify-between items-center gap-2">
                 <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/teacher/edit-class/${classItem.id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="flex-1">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the class "{classItem.subject}" and all of its attendance data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
          </CardFooter>
        )}
      </Card>
  );
}
