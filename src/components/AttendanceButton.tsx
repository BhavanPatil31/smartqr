
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimeSlot } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, setDoc, collection, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { format, toDate } from 'date-fns-tz';


// Helper function to check if current time is within class time in IST
const isClassTime = (timeSlot: TimeSlot) => {
  const timeZone = 'Asia/Kolkata';
  const now = toDate(new Date()); // Get current time in local timezone
  
  const dayOfWeek = format(now, 'EEEE', { timeZone });

  if (dayOfWeek !== timeSlot.day) return false;

  const [startHour, startMinute] = timeSlot.start.split(':').map(Number);
  const [endHour, endMinute] = timeSlot.end.split(':').map(Number);

  const startTimeStr = `${format(now, 'yyyy-MM-dd', { timeZone })}T${timeSlot.start}:00`;
  const endTimeStr = `${format(now, 'yyyy-MM-dd', { timeZone })}T${timeSlot.end}:00`;

  const startTime = toDate(startTimeStr, { timeZone });
  const endTime = toDate(endTimeStr, { timeZone });

  return now >= startTime && now <= endTime;
};

export function AttendanceButton({ classId, classTimeSlot }: { classId: string, classTimeSlot: TimeSlot }) {
  const [user] = useAuthState(auth);
  const { toast } = useToast();
  const [attendanceStatus, setAttendanceStatus] = useState<'pending' | 'success' | 'failure' | 'marked' | 'already_marked'>('pending');
  const [isWithinClassTime, setIsWithinClassTime] = useState(false);
  
  useEffect(() => {
    const checkTime = () => setIsWithinClassTime(isClassTime(classTimeSlot));
    checkTime();
    const interval = setInterval(checkTime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [classTimeSlot]);

  useEffect(() => {
    const checkIfMarked = async () => {
        if (user) {
            const todayStr = format(new Date(), 'yyyy-MM-dd', { timeZone: 'Asia/Kolkata' });
            const attendanceRef = collection(db, 'classes', classId, 'attendance', todayStr, 'records');
            const q = query(attendanceRef, where('studentId', '==', user.uid));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                setAttendanceStatus('already_marked');
            }
        }
    };
    checkIfMarked();
  }, [user, classId]);

  const handleMarkAttendance = async () => {
    if (!user) return;
    setAttendanceStatus('marked');
    
    try {
        const studentProfileRef = doc(db, 'students', user.uid);
        const studentProfileSnap = await getDoc(studentProfileRef);
        
        if (!studentProfileSnap.exists()) {
            throw new Error("Student profile not found.");
        }
        
        const studentProfile = studentProfileSnap.data();
        const todayStr = format(new Date(), 'yyyy-MM-dd', { timeZone: 'Asia/Kolkata' });
        
        // Using a document with user ID to prevent duplicates
        const attendanceDocRef = doc(db, 'classes', classId, 'attendance', todayStr, 'records', user.uid);

        await setDoc(attendanceDocRef, {
            studentId: user.uid,
            studentName: studentProfile.fullName,
            usn: studentProfile.usn,
            timestamp: new Date().getTime(), // Store as UTC timestamp
            deviceInfo: navigator.userAgent, // Example device info
        });

        setAttendanceStatus('success');
        toast({
          title: "Attendance Marked!",
          description: "Your attendance has been successfully recorded.",
          className: "bg-accent text-accent-foreground",
        });

    } catch (error) {
        console.error("Error marking attendance: ", error);
        setAttendanceStatus('failure');
        toast({
          title: "Error",
          description: "Could not mark attendance. Please try again.",
          variant: "destructive"
        });
    }
  };

  const isDisabled = !isWithinClassTime || attendanceStatus === 'success' || attendanceStatus === 'marked' || attendanceStatus === 'already_marked';

  let buttonContent;
  let message;
  let messageColor = '';

  switch (attendanceStatus) {
    case 'success':
      buttonContent = <><CheckCircle className="mr-2" /> Attendance Marked!</>;
      message = 'You can now close this page.';
      messageColor = 'text-green-700';
      break;
    case 'already_marked':
      buttonContent = <><CheckCircle className="mr-2" /> Already Marked</>;
      message = 'Your attendance for this class is already recorded.';
      messageColor = 'text-green-700';
      break;
    case 'failure':
      buttonContent = <><XCircle className="mr-2" /> Marking Failed</>;
      message = 'Attendance can only be marked during class hours.';
      messageColor = 'text-destructive';
      break;
    case 'marked':
       buttonContent = <>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
        Marking...
       </>;
       message = 'Please wait while we record your attendance.';
       break;
    default:
      buttonContent = <><Camera className="mr-2" /> Mark My Attendance</>;
      if (!isWithinClassTime) {
        message = 'This class is not currently in session.';
        messageColor = 'text-muted-foreground';
      }
      break;
  }

  return (
    <div className="flex flex-col items-center space-y-4 w-full">
      <Button 
        onClick={handleMarkAttendance} 
        disabled={isDisabled}
        className={cn(
            'w-full max-w-xs transition-all duration-300',
            (attendanceStatus === 'success' || attendanceStatus === 'already_marked') && 'bg-accent text-accent-foreground hover:bg-accent/90',
            attendanceStatus === 'failure' && 'bg-destructive hover:bg-destructive/90',
        )}
        size="lg"
      >
        {buttonContent}
      </Button>
      {message && <p className={cn("text-sm text-center", messageColor)}>{message}</p>}
    </div>
  );
}
