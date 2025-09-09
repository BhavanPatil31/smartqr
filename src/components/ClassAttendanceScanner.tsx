
"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, CheckCircle, XCircle, ScanLine, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Class, Schedule } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { format, toDate } from 'date-fns-tz';
import jsQR from 'jsqr';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Helper function to check if current time is within any of the class schedules in IST
const isClassTime = (schedules: Schedule[]) => {
  if (!schedules) return false;
  const timeZone = 'Asia/Kolkata';
  const now = toDate(new Date());
  const dayOfWeek = format(now, 'EEEE', { timeZone });

  return schedules.some(schedule => {
    if (dayOfWeek !== schedule.day) return false;

    const startTimeStr = `${format(now, 'yyyy-MM-dd', { timeZone })}T${schedule.startTime}:00`;
    const endTimeStr = `${format(now, 'yyyy-MM-dd', { timeZone })}T${schedule.endTime}:00`;
    const startTime = toDate(startTimeStr, { timeZone });
    const endTime = toDate(endTimeStr, { timeZone });

    return now >= startTime && now <= endTime;
  });
};

export function ClassAttendanceScanner({ classItem }: { classItem: Class }) {
  const [user] = useAuthState(auth);
  const { toast } = useToast();
  
  const [status, setStatus] = useState<'idle' | 'scanning' | 'verifying' | 'success' | 'failure' | 'already_marked' | 'wrong_qr' | 'not_class_time'>('idle');
  const [isWithinClassTime, setIsWithinClassTime] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  // 1. Check if class is in session and if attendance is already marked
  useEffect(() => {
    const checkIfMarked = async () => {
        if (user) {
            const todayStr = format(new Date(), 'yyyy-MM-dd', { timeZone: 'Asia/Kolkata' });
            const attendanceRef = collection(db, 'classes', classItem.id, 'attendance', todayStr, 'records');
            const q = query(attendanceRef, where('studentId', '==', user.uid));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                setStatus('already_marked');
                return true;
            }
        }
        return false;
    };
    
    const checkTime = () => {
      const isTime = isClassTime(classItem.schedules);
      setIsWithinClassTime(isTime);
      return isTime;
    };

    const runChecks = async () => {
      const isMarked = await checkIfMarked();
      if(isMarked) return;

      const isTime = checkTime();
       if (!isTime) {
          setStatus('not_class_time');
      } else {
          // If it is class time, and not marked, reset to idle to allow scanning
          setStatus('idle');
      }
    };
    
    runChecks();

    const interval = setInterval(runChecks, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [classItem.schedules, classItem.id, user]);

  // 2. Handle camera permission and scanning logic
  useEffect(() => {
    let animationFrameId: number;

    const tick = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });

            if (code) {
                verifyAndMarkAttendance(code.data);
                // Stop scanning after finding a code
                setStatus('verifying');
                if (videoRef.current && videoRef.current.srcObject) {
                    const stream = videoRef.current.srcObject as MediaStream;
                    stream.getTracks().forEach(track => track.stop());
                }
                cancelAnimationFrame(animationFrameId);
            } else {
                animationFrameId = requestAnimationFrame(tick);
            }
        }
      } else {
        animationFrameId = requestAnimationFrame(tick);
      }
    };
    
    if (status === 'scanning' && hasCameraPermission) {
      animationFrameId = requestAnimationFrame(tick);
    }
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [status, hasCameraPermission]);


  const startScan = async () => {
    setStatus('scanning');
    setHasCameraPermission(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      setStatus('failure');
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings.',
      });
    }
  };

  const verifyAndMarkAttendance = async (scannedData: string) => {
    if (!user) return;
    
    let scannedClassId = '';
    try {
        const url = new URL(scannedData);
        const pathParts = url.pathname.split('/');
        // Assuming URL is like /student/class/CLASS_ID
        if (pathParts[1] === 'student' && pathParts[2] === 'class' && pathParts[3]) {
            scannedClassId = pathParts[3];
        }
    } catch (e) {
        // Not a valid URL, could be just the ID
        scannedClassId = scannedData;
    }

    if (scannedClassId !== classItem.id) {
        setStatus('wrong_qr');
        return;
    }

    try {
        const studentProfileRef = doc(db, 'students', user.uid);
        const studentProfileSnap = await getDoc(studentProfileRef);
        if (!studentProfileSnap.exists()) throw new Error("Student profile not found.");
        
        const studentProfile = studentProfileSnap.data();
        const todayStr = format(new Date(), 'yyyy-MM-dd', { timeZone: 'Asia/Kolkata' });
        const attendanceDocRef = doc(db, 'classes', classItem.id, 'attendance', todayStr, 'records', user.uid);

        await setDoc(attendanceDocRef, {
            studentId: user.uid,
            studentName: studentProfile.fullName,
            usn: studentProfile.usn,
            timestamp: new Date().getTime(),
            deviceInfo: navigator.userAgent,
        });

        setStatus('success');
        toast({
          title: "Attendance Marked!",
          description: "Your attendance has been successfully recorded.",
        });

    } catch (error) {
        console.error("Error marking attendance: ", error);
        setStatus('failure');
        toast({
          title: "Error",
          description: "Could not mark attendance. Please try again.",
          variant: "destructive"
        });
    }
  };

  const renderContent = () => {
    switch(status) {
        case 'scanning':
            return (
                <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg border bg-muted">
                    <video ref={videoRef} className="h-full w-full object-cover" autoPlay playsInline muted />
                    <canvas ref={canvasRef} className="hidden" />
                    {hasCameraPermission === false && (
                         <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <Alert variant="destructive" className="w-4/5">
                                <AlertTitle>Camera Access Required</AlertTitle>
                                <AlertDescription>Please allow camera access.</AlertDescription>
                            </Alert>
                        </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2/3 h-2/3 border-4 border-dashed border-primary/50 rounded-lg" />
                        <div className="absolute top-0 h-1 w-full bg-primary/80 animate-[scan_2s_ease-in-out_infinite]" />
                    </div>
                    <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-white bg-black/50 px-2 py-1 rounded-md">Point camera at the class QR code</p>
                </div>
            )
        case 'verifying':
            return <p className="text-muted-foreground">Verifying QR Code...</p>;
        case 'success':
            return <Alert className="border-green-500 text-green-700"><CheckCircle className="h-4 w-4" /><AlertTitle>Success!</AlertTitle><AlertDescription>Attendance marked for {classItem.subject}.</AlertDescription></Alert>;
        case 'already_marked':
            return <Alert className="border-green-500 text-green-700"><CheckCircle className="h-4 w-4" /><AlertTitle>Already Marked</AlertTitle><AlertDescription>Your attendance is already recorded for today.</AlertDescription></Alert>;
        case 'not_class_time':
            return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Class Not In Session</AlertTitle><AlertDescription>You can only mark attendance during scheduled class hours.</AlertDescription></Alert>;
        case 'wrong_qr':
             return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Wrong QR Code</AlertTitle><AlertDescription>This QR code is not for {classItem.subject}. <Button variant="link" className="p-0 h-auto" onClick={() => setStatus('idle')}>Try Again</Button></AlertDescription></Alert>;
        case 'failure':
            return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>Something went wrong. Please try again. <Button variant="link" className="p-0 h-auto" onClick={() => setStatus('idle')}>Retry</Button></AlertDescription></Alert>;
        case 'idle':
        default:
            const isButtonDisabled = !isWithinClassTime || status !== 'idle';
            return (
                <div className="flex flex-col items-center space-y-2">
                    <Button onClick={startScan} disabled={isButtonDisabled} size="lg">
                        <Camera className="mr-2" /> Scan to Mark Attendance
                    </Button>
                    {isButtonDisabled && status !== 'already_marked' && (
                        <p className="text-sm text-destructive">This class is not in session.</p>
                    )}
                </div>
            )
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[150px]">
      {renderContent()}
    </div>
  );
}
