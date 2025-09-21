
"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { AttendanceTable } from '@/components/AttendanceTable';
import { SuspiciousActivityChecker } from '@/components/SuspiciousActivityChecker';
import { getClassById, generateQRCodeForClass, isQRCodeValid, getQRCodeTimeRemaining, formatTimeRemaining } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, QrCode as QrCodeIcon, Cpu, ChevronLeft, Clock, Calendar as CalendarIcon, Download, MapPin, RefreshCw, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns-tz';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Class, AttendanceRecord } from '@/lib/data';
import { collection, onSnapshot, query, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { getAttendanceForDate as getAttendanceForDateAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { formatTime } from '@/lib/utils';


export default function TeacherClassPage() {
  const params = useParams();
  const classId = params.id as string;
  const { toast } = useToast();
  
  const [classItem, setClassItem] = useState<Class | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveAttendanceRecords, setLiveAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [qrTimeRemaining, setQrTimeRemaining] = useState(0);
  
  // State for historical attendance
  const [historyDate, setHistoryDate] = useState<Date | undefined>(new Date());
  const [historicalRecords, setHistoricalRecords] = useState<AttendanceRecord[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      setQrCodeUrl(`${window.location.origin}/student/class/${classId}`);
    }
  }, [classId]);
  
  useEffect(() => {
    if (!classId) return;

    const fetchClassData = async () => {
      setLoading(true);
      try {
        // Check if teacher is approved
        const user = auth.currentUser;
        if (!user) {
          toast({ title: "Error", description: "You must be logged in to view class details.", variant: "destructive" });
          window.location.href = '/teacher/login';
          return;
        }
        
        const teacherDocRef = doc(db, 'teachers', user.uid);
        const teacherDocSnap = await getDoc(teacherDocRef);
        
        if (teacherDocSnap.exists()) {
          const teacherData = teacherDocSnap.data();
          if (teacherData.isApproved !== true) {
            toast({ title: 'Access Denied', description: 'Your account is pending approval. You cannot access class details until approved by an administrator.', variant: 'destructive' });
            window.location.href = '/teacher/pending-approval';
            return;
          }
        }
        
        // If approved, proceed with fetching class data
        const fetchedClass = await getClassById(classId);
        setClassItem(fetchedClass);
      } catch (error) {
        console.error("Error fetching class data:", error);
        toast({ title: "Error", description: "Failed to load class data.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchClassData();
  }, [classId]);

  // Listener for LIVE attendance
  useEffect(() => {
    if (!classId) return;
    
    const todayStr = format(new Date(), 'yyyy-MM-dd', { timeZone: 'Asia/Kolkata' });
    
    // First check if the class exists and user has permission
    const setupListener = async (): Promise<(() => void) | null> => {
      try {
        // Verify class exists and user has access
        const classDocRef = doc(db, 'classes', classId);
        const classDoc = await getDoc(classDocRef);
        
        if (!classDoc.exists()) {
          console.error('Class not found:', classId);
          return null;
        }
        
        const classData = classDoc.data();
        const currentUser = auth.currentUser;
        
        if (!currentUser || classData.teacherId !== currentUser.uid) {
          console.error('Access denied to class:', classId);
          return null;
        }
        
        // Set up the attendance listener
        const attendanceCollectionRef = collection(db, 'classes', classId, 'attendance', todayStr, 'records');
        const q = query(attendanceCollectionRef);

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const records = querySnapshot.docs.map(doc => doc.data() as AttendanceRecord);
          setLiveAttendanceRecords(records);
        }, (error) => {
          console.error('Error in attendance listener:', error);
          // Don't log the error details to avoid console spam for non-existent collections
          // This is normal when no attendance has been marked yet
          setLiveAttendanceRecords([]);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error setting up attendance listener:', error);
        setLiveAttendanceRecords([]);
        return null;
      }
    };
    
    let unsubscribe: (() => void) | null = null;
    
    setupListener().then((unsub) => {
      if (unsub) {
        unsubscribe = unsub;
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [classId]);
  
  const handleFetchHistory = async () => {
    if (!historyDate || !classId) return;
    setIsHistoryLoading(true);
    try {
        const dateStr = format(historyDate, 'yyyy-MM-dd');
        const records = await getAttendanceForDateAction(classId, dateStr);
        setHistoricalRecords(records);
    } catch (error) {
        console.error("Failed to fetch history:", error);
        toast({ title: "Error", description: "Could not fetch attendance history.", variant: "destructive" });
    } finally {
        setIsHistoryLoading(false);
    }
  };

  // Effect to auto-fetch today's attendance for history tab on first load
  useEffect(() => {
    handleFetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerateQR = async () => {
    if (!classId) return;
    
    setIsGeneratingQR(true);
    try {
      const { qrCode, expiresAt } = await generateQRCodeForClass(classId);
      
      // Refresh class data to get updated QR info
      const updatedClass = await getClassById(classId);
      setClassItem(updatedClass);
      
      toast({
        title: 'QR Code Generated',
        description: 'New QR code generated successfully! It will expire in 10 minutes.',
      });
    } catch (error: any) {
      console.error('Error generating QR code:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      toast({
        title: 'Error',
        description: `Failed to generate QR code: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingQR(false);
    }
  };

  // Timer to update QR code remaining time
  useEffect(() => {
    if (!classItem || !isQRCodeValid(classItem)) {
      setQrTimeRemaining(0);
      return;
    }

    const updateTimer = () => {
      const remaining = getQRCodeTimeRemaining(classItem);
      setQrTimeRemaining(remaining);
      
      if (remaining <= 0) {
        // QR code has expired, refresh class data
        getClassById(classId).then(updatedClass => {
          setClassItem(updatedClass);
        });
      }
    };

    updateTimer(); // Initial update
    const interval = setInterval(updateTimer, 1000); // Update every second

    return () => clearInterval(interval);
  }, [classItem, classId]);

  const handleExport = (records: AttendanceRecord[], date: Date | undefined) => {
    if (records.length === 0) {
        toast({ title: 'No Data', description: 'There are no attendance records to export.' });
        return;
    }

    const headers = ['Student Name', 'USN', 'Time Marked (IST)'];
    // Sort records by timestamp before exporting
    const sortedRecords = [...records].sort((a, b) => a.timestamp - b.timestamp);

    const csvContent = [
        headers.join(','),
        ...sortedRecords.map(record => [
            `"${record.studentName}"`,
            `"${record.usn}"`,
            `"${format(new Date(record.timestamp), 'hh:mm:ss a', { timeZone: 'Asia/Kolkata' })}"`
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    const url = URL.createObjectURL(blob);
    link.href = url;
    const dateStr = date ? format(date, 'yyyy-MM-dd') : 'live';
    link.setAttribute('download', `${classItem?.subject}_attendance_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (loading) {
    return (
       <div className="flex min-h-screen w-full flex-col bg-muted/40">
          <Header />
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
             <div className="space-y-2">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
             </div>
             <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                             <Skeleton className="h-6 w-40 mb-2" />
                             <Skeleton className="h-4 w-3/4" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-48 w-full" />
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-48 mb-2" />
                            <Skeleton className="h-4 w-3/4" />
                        </CardHeader>
                        <CardContent>
                           <Skeleton className="h-10 w-56" />
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-32 mb-2" />
                            <Skeleton className="h-4 w-3/4" />
                        </CardHeader>
                        <CardContent className="flex flex-col items-center">
                            <Skeleton className="h-[216px] w-[216px]" />
                            <Skeleton className="h-4 w-40 mt-4" />
                        </CardContent>
                    </Card>
                </div>
             </div>
          </main>
       </div>
    );
  }

  if (!classItem) {
    notFound();
  }
  
  const today = format(new Date(), 'yyyy-MM-dd');
  
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-start justify-between">
          <div>
             <Button asChild variant="ghost" className="-ml-4 mb-2">
                <Link href="/teacher/dashboard"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
            </Button>
            <h1 className="font-semibold font-headline text-lg md:text-2xl">{classItem.subject}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {classItem.teacherName}
            </p>
             <div className="text-sm text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:gap-4 mt-2">
                {classItem.schedules?.map((schedule, index) => (
                    <div key={index} className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{schedule.day}, {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{schedule.roomNumber}</span>
                        {index < (classItem.schedules.length - 1) && <span className="hidden sm:inline">&middot;</span>}
                    </div>
                ))}
             </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
           <Tabs defaultValue="live">
             <TabsList>
                <TabsTrigger value="live">Live Attendance</TabsTrigger>
                <TabsTrigger value="history">Attendance History</TabsTrigger>
                <TabsTrigger value="ai">AI Analysis</TabsTrigger>
             </TabsList>
             <TabsContent value="live" className="mt-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary"/>
                                <CardTitle>Live Attendance ({today})</CardTitle>
                            </div>
                            <CardDescription>Students who have marked attendance today.</CardDescription>
                        </div>
                         <Button variant="outline" size="sm" onClick={() => handleExport(liveAttendanceRecords, new Date())} disabled={liveAttendanceRecords.length === 0}>
                            <Download className="mr-2 h-4 w-4" /> Export CSV
                        </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <AttendanceTable records={liveAttendanceRecords} />
                  </CardContent>
                </Card>
             </TabsContent>
              <TabsContent value="history" className="mt-4">
                 <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>View Past Attendance</CardTitle>
                                <CardDescription>Select a date to view and export attendance records.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => handleExport(historicalRecords, historyDate)} disabled={historicalRecords.length === 0}>
                                <Download className="mr-2 h-4 w-4" /> Export CSV
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-2">
                             <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className="w-[280px] justify-start text-left font-normal"
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {historyDate ? format(historyDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={historyDate}
                                    onSelect={setHistoryDate}
                                    initialFocus
                                    disabled={(date) => date > new Date() || date < new Date("2024-01-01")}
                                />
                                </PopoverContent>
                            </Popover>
                             <Button onClick={handleFetchHistory} disabled={!historyDate || isHistoryLoading}>
                                {isHistoryLoading ? 'Loading...' : 'View Attendance'}
                            </Button>
                        </div>
                        {isHistoryLoading ? <Skeleton className="h-48 w-full" /> : <AttendanceTable records={historicalRecords} />}
                    </CardContent>
                 </Card>
              </TabsContent>
               <TabsContent value="ai" className="mt-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                            <Cpu className="h-5 w-5 text-primary"/>
                            <CardTitle>AI Attendance Analysis</CardTitle>
                            </div>
                            <CardDescription>Detect suspicious patterns in today's live attendance data.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SuspiciousActivityChecker classItem={classItem} attendanceRecords={liveAttendanceRecords} />
                        </CardContent>
                    </Card>
               </TabsContent>
           </Tabs>
          </div>
          
          <div className="lg:col-span-1">
            <Card className="gradient-card-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                      <QrCodeIcon className="h-5 w-5"/>
                      <CardTitle>Class QR Code</CardTitle>
                  </div>
                  {classItem && isQRCodeValid(classItem) && (
                    <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      {formatTimeRemaining(qrTimeRemaining)}
                    </div>
                  )}
                </div>
                <CardDescription className="text-primary-foreground/80">
                  Students can scan this to mark attendance.
                  {classItem && !isQRCodeValid(classItem) && (
                    <span className="flex items-center gap-1 mt-1 text-red-200">
                      <AlertTriangle className="h-3 w-3" />
                      QR Code Expired
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                 {qrCodeUrl && classItem && isQRCodeValid(classItem) ? (
                    <div className="p-4 bg-white rounded-lg border">
                        <Image 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${qrCodeUrl}?qr=${classItem.qrCode}`)}`}
                            width={200}
                            height={200}
                            alt="Class QR Code"
                            data-ai-hint="QR code"
                        />
                    </div>
                 ) : classItem && !isQRCodeValid(classItem) ? (
                    <div className="p-4 bg-gray-100 rounded-lg border border-dashed flex flex-col items-center justify-center h-[216px] w-[216px]">
                      <AlertTriangle className="h-12 w-12 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 text-center">QR Code Expired</p>
                      <p className="text-xs text-gray-500 text-center mt-1">Generate a new one</p>
                    </div>
                 ) : (
                    <Skeleton className="h-[216px] w-[216px]" />
                 )}
                
                <div className="mt-4 w-full space-y-2">
                  <Button 
                    onClick={handleGenerateQR} 
                    disabled={isGeneratingQR}
                    className="w-full"
                    variant={classItem && isQRCodeValid(classItem) ? "outline" : "default"}
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${isGeneratingQR ? 'animate-spin' : ''}`} />
                    {isGeneratingQR ? 'Generating...' : 
                     classItem && isQRCodeValid(classItem) ? 'Regenerate QR' : 'Generate QR Code'}
                  </Button>
                  
                  {classItem && isQRCodeValid(classItem) && (
                    <p className="text-xs text-primary-foreground/70 text-center">
                      QR code expires in {formatTimeRemaining(qrTimeRemaining)}
                    </p>
                  )}
                  
                  {classItem && !isQRCodeValid(classItem) && (
                    <p className="text-xs text-red-200 text-center">
                      Generate a new QR code to allow student attendance
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
