
"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { AttendanceTable } from '@/components/AttendanceTable';
import { SuspiciousActivityChecker } from '@/components/SuspiciousActivityChecker';
import { getClassById } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, QrCode as QrCodeIcon, Cpu, ChevronLeft, Clock, Calendar as CalendarIcon, Download, MapPin } from 'lucide-react';
import { format } from 'date-fns-tz';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Class, AttendanceRecord } from '@/lib/data';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
      const fetchedClass = await getClassById(classId);
      setClassItem(fetchedClass);
      setLoading(false);
    };

    fetchClassData();
  }, [classId]);

  // Listener for LIVE attendance
  useEffect(() => {
    if (!classId) return;
    
    const todayStr = format(new Date(), 'yyyy-MM-dd', { timeZone: 'Asia/Kolkata' });
    const attendanceCollectionRef = collection(db, 'classes', classId, 'attendance', todayStr, 'records');
    const q = query(attendanceCollectionRef);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const records = querySnapshot.docs.map(doc => doc.data() as AttendanceRecord);
      setLiveAttendanceRecords(records);
    });

    return () => unsubscribe();
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
                <div className="flex items-center gap-2">
                    <QrCodeIcon className="h-5 w-5"/>
                    <CardTitle>Class QR Code</CardTitle>
                </div>
                <CardDescription className="text-primary-foreground/80">Students can scan this to mark attendance.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                 {qrCodeUrl ? (
                    <div className="p-4 bg-white rounded-lg border">
                        <Image 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`}
                            width={200}
                            height={200}
                            alt="Class QR Code"
                            data-ai-hint="QR code"
                        />
                    </div>
                 ) : (
                    <Skeleton className="h-[216px] w-[216px]" />
                 )}
                <p className="mt-4 text-xs text-primary-foreground/70 text-center">This QR code directs students to the attendance page.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
