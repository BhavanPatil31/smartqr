"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimeSlot } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

// Helper function to check if current time is within class time
const isClassTime = (timeSlot: TimeSlot) => {
  const now = new Date();
  const dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()];
  
  // For demo purposes, we can bypass the day check
  // if (dayOfWeek !== timeSlot.day) return false;

  const [startHour, startMinute] = timeSlot.start.split(':').map(Number);
  const [endHour, endMinute] = timeSlot.end.split(':').map(Number);

  const startTime = new Date();
  startTime.setHours(startHour, startMinute, 0, 0);

  const endTime = new Date();
  endTime.setHours(endHour, endMinute, 0, 0);

  return now >= startTime && now <= endTime;
};

export function AttendanceButton({ classTimeSlot }: { classTimeSlot: TimeSlot }) {
  const [attendanceStatus, setAttendanceStatus] = useState<'pending' | 'success' | 'failure' | 'marked'>('pending');
  const [isWithinClassTime, setIsWithinClassTime] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check initially and then every minute
    const checkTime = () => setIsWithinClassTime(isClassTime(classTimeSlot));
    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, [classTimeSlot]);

  const handleMarkAttendance = () => {
    setAttendanceStatus('marked');
    setTimeout(() => {
        if (isWithinClassTime) {
            setAttendanceStatus('success');
            toast({
              title: "Attendance Marked!",
              description: "Your attendance has been successfully recorded.",
            })
        } else {
            setAttendanceStatus('failure');
        }
    }, 1500);
  };

  const isDisabled = !isWithinClassTime || attendanceStatus === 'success' || attendanceStatus === 'marked';

  let buttonContent;
  let message;
  let messageColor = '';

  switch (attendanceStatus) {
    case 'success':
      buttonContent = <><CheckCircle className="mr-2" /> Attendance Marked!</>;
      message = 'You can now close this page.';
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
            attendanceStatus === 'success' && 'bg-accent text-accent-foreground hover:bg-accent/90',
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
