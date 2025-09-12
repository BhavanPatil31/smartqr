
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { AttendanceTable } from '@/components/AttendanceTable';
import { getClassById } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ChevronLeft, Clock, Calendar as CalendarIcon, MapPin } from 'lucide-react';
import { format } from 'date-fns-tz';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Class, AttendanceRecord } from '@/lib/data';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LogOut } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { getAttendanceForDate as getAttendanceForDateAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';


export default function AdminClassViewPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;
  const { toast } = useToast();
  
  const [classItem, setClassItem] = useState<Class | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveAttendanceRecords, setLiveAttendanceRecords] = useState<AttendanceRecord[]>([]);

  // State for historical attendance
  const [historyDate, setHistoryDate] = useState<Date | undefined>(new Date());
  const [historicalRecords, setHistoricalRecords] = useState<AttendanceRecord[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

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

  useEffect(() => {
    if (!classId) return;
    
    const todayStr = format(new Date(), 'yyyy-MM-dd', { timeZone: 'Asia/Kolkata' });
    const attendanceCollectionRef = collection(db, 'classes', classId, 'attendance', todayStr, 'records');
    const q = query(attendanceCollectionRef);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const records = querySnapshot.docs.map(doc => doc.data() as AttendanceRecord);
      setLiveAttendanceRecords(records);
    }, (error) => {
      console.error("Error fetching attendance: ", error);
    });

    return () => unsubscribe();
  }, [classId]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
  };
  
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
             <Card>
                <CardHeader>
                     <Skeleton className="h-6 w-40 mb-2" />
                     <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-48 w-full" />
                </CardContent>
            </Card>
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
      <Header>
          <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
          </Button>
      </Header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-start justify-between">
          <div>
             <Button asChild variant="ghost" className="-ml-4 mb-2">
                <Link href="/admin/dashboard"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
            </Button>
            <h1 className="font-semibold font-headline text-lg md:text-2xl">{classItem.subject}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {classItem.teacherName}
            </p>
            <div className="text-sm text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:gap-4 mt-2">
              {classItem.schedules?.map((schedule, index) => (
                  <div key={index} className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{schedule.day}, {schedule.startTime} - {schedule.endTime}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{schedule.roomNumber}</span>
                      {index < (classItem.schedules.length - 1) && <span className="hidden sm:inline">&middot;</span>}
                  </div>
              ))}
            </div>
          </div>
        </div>

        <Tabs defaultValue="live">
            <TabsList>
                <TabsTrigger value="live">Live Attendance</TabsTrigger>
                <TabsTrigger value="history">Attendance History</TabsTrigger>
            </TabsList>
            <TabsContent value="live" className="mt-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary"/>
                        <CardTitle>Live Attendance ({today})</CardTitle>
                        </div>
                        <CardDescription>Read-only view of students who have marked attendance today.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AttendanceTable records={liveAttendanceRecords} />
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="history" className="mt-4">
                 <Card>
                    <CardHeader>
                        <CardTitle>View Past Attendance</CardTitle>
                        <CardDescription>Select a date to view attendance records.</CardDescription>
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
        </Tabs>

      </main>
    </div>
  );
}
