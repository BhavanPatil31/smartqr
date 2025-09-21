
"use client";

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, User, MapPin, Edit, Trash2, Radio, CheckCircle, QrCode, AlertTriangle, Eye, MessageSquare } from 'lucide-react';
import type { Class } from '@/lib/data';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { isClassCurrentlyLive, isQRCodeValid, getQRCodeTimeRemaining, formatTimeRemaining } from '@/lib/data';
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
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { formatTime } from '@/lib/utils';
import { deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { TeacherMessageDialog } from './TeacherMessageDialog';
import { useAuthState } from 'react-firebase-hooks/auth';


interface ClassCardProps {
  classItem: Class;
  userRole: 'student' | 'teacher' | 'admin';
  hasAttendanceMarked?: boolean; // Optional prop to show attendance status
}

export function ClassCard({ classItem, userRole, hasAttendanceMarked = false }: ClassCardProps) {
  const href = `/${userRole}/class/${classItem.id}`;
  const { toast } = useToast();
  const router = useRouter();
  const [user] = useAuthState(auth);
  const isLive = isClassCurrentlyLive(classItem);
  const isQRValid = isQRCodeValid(classItem);
  const qrTimeRemaining = getQRCodeTimeRemaining(classItem);

  const handleDelete = async () => {
    try {
      const classDocRef = doc(db, 'classes', classItem.id);
      await deleteDoc(classDocRef);
      toast({
        title: "Class Deleted",
        description: `The class "${classItem.subject}" has been successfully deleted.`,
      });
      router.refresh(); // Refresh the page to update the class list
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
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">{classItem.subject}</CardTitle>
                <CardDescription className="pt-1">{classItem.department} - {classItem.semester}</CardDescription>
              </div>
              <div className="flex flex-col gap-2 ml-2">
                {isLive && (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 animate-pulse">
                    <Radio className="h-3 w-3 mr-1" />
                    LIVE
                  </Badge>
                )}
                {hasAttendanceMarked && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Attendance Marked
                  </Badge>
                )}
                {userRole === 'teacher' && isQRValid && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <QrCode className="h-3 w-3 mr-1" />
                    QR: {formatTimeRemaining(qrTimeRemaining)}
                  </Badge>
                )}
                {userRole === 'teacher' && !isQRValid && classItem.qrCode !== undefined && (
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    QR Expired
                  </Badge>
                )}
              </div>
            </div>
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
          <CardFooter className="pt-4">
              <div className="flex w-full flex-col gap-2">
                {/* Message Button - Full Width */}
                {user && (
                  <TeacherMessageDialog 
                    classItem={classItem}
                    teacherId={user.uid}
                    teacherName={classItem.teacherName}
                  />
                )}
                
                {/* Edit and Delete Buttons */}
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
              </div>
          </CardFooter>
        )}
        
        {userRole === 'admin' && (
          <CardFooter className="pt-4">
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href={`/admin/class/${classItem.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </Button>
          </CardFooter>
        )}
      </Card>
  );
}
