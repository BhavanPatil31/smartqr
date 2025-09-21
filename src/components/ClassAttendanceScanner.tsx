
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, CheckCircle, XCircle, AlertCircle, Keyboard } from 'lucide-react';
import type { Class, Schedule } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { isQRCodeValid } from '@/lib/data';
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { format, toDate } from 'date-fns-tz';
import jsQR from 'jsqr';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MobileCameraTroubleshooting } from '@/components/MobileCameraTroubleshooting';

// Helper function to check if current time is within any of the class schedules in IST
const isClassTime = (schedules: Schedule[]) => {
  if (!schedules) return false;
  const timeZone = 'Asia/Kolkata';
  const now = new Date();
  const dayOfWeek = format(now, 'EEEE', { timeZone });

  return schedules.some(schedule => {
    if (dayOfWeek !== schedule.day) return false;

    const todayStr = format(now, 'yyyy-MM-dd', { timeZone });
    const startTimeStr = `${todayStr}T${schedule.startTime}:00`;
    const endTimeStr = `${todayStr}T${schedule.endTime}:00`;
    
    try {
        const startTime = toDate(startTimeStr, { timeZone });
        const endTime = toDate(endTimeStr, { timeZone });
        return now >= startTime && now <= endTime;
    } catch (e) {
        console.error("Error parsing date/time for schedule check:", e);
        return false;
    }
  });
};

export function ClassAttendanceScanner({ classItem }: { classItem: Class }) {
  const [user] = useAuthState(auth);
  const { toast } = useToast();
  
  const [status, setStatus] = useState<'idle' | 'scanning' | 'verifying' | 'success' | 'failure' | 'already_marked' | 'wrong_qr' | 'not_class_time' | 'qr_expired'>('idle');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualCode, setManualCode] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string>('');
  const [isHttps, setIsHttps] = useState(true);
  
  const stopScan = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const verifyAndMarkAttendance = useCallback(async (scannedData: string) => {
    if (!user) return;
    setStatus('verifying');
    stopScan();
    
    let scannedClassId = '';
    let scannedQRCode = '';
    
    try {
        const url = new URL(scannedData);
        const pathParts = url.pathname.split('/');
        if (pathParts[1] === 'student' && pathParts[2] === 'class' && pathParts[3]) {
            scannedClassId = pathParts[3];
            // Extract QR code from URL parameters
            const urlParams = new URLSearchParams(url.search);
            scannedQRCode = urlParams.get('qr') || '';
        }
    } catch (e) {
        scannedClassId = scannedData;
    }

    if (scannedClassId !== classItem.id) {
        setStatus('wrong_qr');
        return;
    }

    // Check if QR code is valid and not expired
    if (!isQRCodeValid(classItem)) {
        setStatus('qr_expired');
        return;
    }

    // Verify the scanned QR code matches the current class QR code
    if (scannedQRCode && classItem.qrCode && scannedQRCode !== classItem.qrCode) {
        setStatus('qr_expired');
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
            classId: classItem.id, // Add classId to the record
            subject: classItem.subject, // Add subject to the record
        });

        setStatus('success');
        toast({
          title: "Attendance Marked!",
          description: "Your attendance has been successfully recorded.",
          className: "bg-accent text-accent-foreground",
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
  }, [user, classItem.id, classItem.subject, toast, stopScan]);


  // Main check effect
  useEffect(() => {
    const runChecks = async () => {
      if (!user) return;
      if (status === 'scanning' || status === 'verifying') return;

      const todayStr = format(new Date(), 'yyyy-MM-dd', { timeZone: 'Asia/Kolkata' });
      const attendanceRef = collection(db, 'classes', classItem.id, 'attendance', todayStr, 'records');
      const q = query(attendanceRef, where('studentId', '==', user.uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setStatus('already_marked');
        return;
      }
      
      if (isClassTime(classItem.schedules)) {
        setStatus('idle');
      } else {
        setStatus('not_class_time');
      }
    };
    
    runChecks();
    const interval = setInterval(runChecks, 30000);
    return () => {
        clearInterval(interval);
        stopScan();
    };
  }, [user, classItem.id, classItem.schedules, status, stopScan]);


  // Scanning logic effect
  useEffect(() => {
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
            const code = jsQR(imageData.data, imageData.width, imageData.height);

            if (code) {
                verifyAndMarkAttendance(code.data);
            } else {
                animationFrameId.current = requestAnimationFrame(tick);
            }
        }
      } else {
        animationFrameId.current = requestAnimationFrame(tick);
      }
    };
    
    if (status === 'scanning' && hasCameraPermission) {
      animationFrameId.current = requestAnimationFrame(tick);
    }
    
    return () => {
      if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [status, hasCameraPermission, verifyAndMarkAttendance]);


  const startScan = async () => {
    setStatus('scanning');
    setHasCameraPermission(null);
    setCameraError('');
    
    // Check if we're on HTTPS (required for camera access on mobile)
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    setIsHttps(isSecure);
    
    if (!isSecure) {
      setCameraError('Camera access requires HTTPS. Please use a secure connection.');
      setHasCameraPermission(false);
      setStatus('failure');
      return;
    }
    
    // Check if mediaDevices is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported in this browser.');
      setHasCameraPermission(false);
      setStatus('failure');
      return;
    }
    
    try {
      // Try multiple camera configurations for better mobile compatibility
      let stream;
      const constraints = [
        // Prefer back camera on mobile
        { video: { facingMode: { exact: 'environment' } } },
        // Fallback to any back camera
        { video: { facingMode: 'environment' } },
        // Fallback to any camera
        { video: true },
        // Last resort with basic constraints
        { video: { width: { min: 640 }, height: { min: 480 } } }
      ];
      
      for (const constraint of constraints) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraint);
          break;
        } catch (err) {
          console.log('Failed with constraint:', constraint, err);
          continue;
        }
      }
      
      if (!stream) {
        throw new Error('Unable to access camera with any configuration');
      }
      
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Add event listeners for better mobile support
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        await videoRef.current.play();
      }
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      setStatus('failure');
      
      let errorMessage = 'Unable to access camera. ';
      let errorTitle = 'Camera Access Error';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorTitle = 'Camera Permission Denied';
        errorMessage = 'Please allow camera access in your browser settings. On mobile, you may need to refresh the page after granting permission.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Camera is being used by another application. Please close other apps using the camera and try again.';
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        errorMessage = 'Camera does not meet the required specifications. Try using a different camera or device.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Camera access is not supported in this browser. Try using Chrome, Firefox, or Safari.';
      } else if (error.name === 'AbortError') {
        errorMessage = 'Camera access was aborted. Please try again.';
      }
      
      setCameraError(errorMessage);
      toast({
        variant: 'destructive',
        title: errorTitle,
        description: errorMessage,
      });
    }
  };

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      verifyAndMarkAttendance(manualCode.trim());
    }
  };
  
  const isButtonDisabled = status !== 'idle';
  
  const renderContent = () => {
    switch(status) {
        case 'scanning':
            return (
                <div className="relative w-full max-w-lg overflow-hidden rounded-lg border bg-muted aspect-video">
                    <video ref={videoRef} className="h-full w-full object-cover" autoPlay playsInline muted />
                    <canvas ref={canvasRef} className="hidden" />
                    {hasCameraPermission === false && (
                         <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <Alert variant="destructive" className="w-4/5 max-h-32 overflow-y-auto">
                                <AlertTitle>Camera Access Required</AlertTitle>
                                <AlertDescription className="text-xs">
                                  {cameraError || 'Please allow camera access and refresh the page.'}
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2/3 h-2/3 border-4 border-dashed border-primary/50 rounded-lg" />
                        <div className="absolute top-0 h-1 w-full bg-primary/80 animate-scan" />
                    </div>
                    <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-white bg-black/50 px-2 py-1 rounded-md">Point camera at the class QR code</p>
                </div>
            )
        case 'verifying':
            return <p className="text-muted-foreground">Verifying QR Code...</p>;
        case 'success':
            return <Alert className="border-green-500 text-green-700 bg-green-500/10"><CheckCircle className="h-4 w-4" /><AlertTitle>Success!</AlertTitle><AlertDescription>Attendance marked for {classItem.subject}.</AlertDescription></Alert>;
        case 'already_marked':
            return <Alert className="border-green-500 text-green-700 bg-green-500/10"><CheckCircle className="h-4 w-4" /><AlertTitle>Already Marked</AlertTitle><AlertDescription>Your attendance is already recorded for today.</AlertDescription></Alert>;
        case 'not_class_time':
            return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Class Not In Session</AlertTitle><AlertDescription>You can only mark attendance during scheduled class hours.</AlertDescription></Alert>;
        case 'wrong_qr':
             return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Wrong QR Code</AlertTitle><AlertDescription>This QR code is not for {classItem.subject}. <Button variant="link" className="p-0 h-auto" onClick={() => setStatus('idle')}>Try Again</Button></AlertDescription></Alert>;
        case 'qr_expired':
             return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>QR Code Expired</AlertTitle><AlertDescription>This QR code has expired. Please ask your teacher to generate a new one. <Button variant="link" className="p-0 h-auto" onClick={() => setStatus('idle')}>Try Again</Button></AlertDescription></Alert>;
        case 'failure':
            return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>Something went wrong. Please try again. <Button variant="link" className="p-0 h-auto" onClick={() => setStatus('idle')}>Retry</Button></AlertDescription></Alert>;
        case 'idle':
        default:
            return (
                <div className="flex flex-col items-center space-y-4 w-full max-w-md">
                    <Button onClick={startScan} disabled={isButtonDisabled} size="lg" className="w-full">
                        <Camera className="mr-2" /> Scan to Mark Attendance
                    </Button>
                    
                    {hasCameraPermission === false && (
                        <div className="w-full space-y-4">
                            <MobileCameraTroubleshooting 
                                error={cameraError}
                                onRetry={() => setStatus('idle')}
                                showRetryButton={true}
                            />
                            
                            <div className="text-center text-sm text-muted-foreground mb-3">
                                Camera not working? Try manual entry:
                            </div>
                            <div className="space-y-2">
                                <Input
                                    placeholder="Enter QR code manually"
                                    value={manualCode}
                                    onChange={(e) => setManualCode(e.target.value)}
                                    className="w-full"
                                />
                                <Button 
                                    onClick={handleManualSubmit} 
                                    disabled={!manualCode.trim() || isButtonDisabled}
                                    variant="outline" 
                                    className="w-full"
                                >
                                    <Keyboard className="mr-2 h-4 w-4" />
                                    Submit Code
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[200px]">
      {renderContent()}
    </div>
  );
}
