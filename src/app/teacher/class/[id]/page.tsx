import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { AttendanceTable } from '@/components/AttendanceTable';
import { SuspiciousActivityChecker } from '@/components/SuspiciousActivityChecker';
import { getAttendanceForClassOnDate, getClassById, getTeacherById } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, QrCode as QrCodeIcon, Cpu, ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

export default function TeacherClassPage({ params }: { params: { id: string } }) {
  const classItem = getClassById(params.id);

  if (!classItem) {
    notFound();
  }
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const attendanceRecords = getAttendanceForClassOnDate(classItem.id, today);

  const teacher = getTeacherById(classItem.teacherId);
  const qrCodeUrl = `http://localhost:9002/student/class/${classItem.id}`;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-start justify-between">
          <div>
             <Button asChild variant="ghost" className="-ml-4 mb-2">
                <Link href="/teacher/dashboard"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
            </Button>
            <h1 className="font-semibold font-headline text-lg md:text-2xl">{classItem.subject}</h1>
            <p className="text-sm text-muted-foreground">{teacher?.name} &middot; {classItem.timeSlot.day}, {classItem.timeSlot.start} - {classItem.timeSlot.end}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary"/>
                  <CardTitle>Live Attendance ({today})</CardTitle>
                </div>
                <CardDescription>Students who have marked attendance today.</CardDescription>
              </CardHeader>
              <CardContent>
                <AttendanceTable initialRecords={attendanceRecords} />
              </CardContent>
            </Card>

             <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-primary"/>
                  <CardTitle>AI Attendance Analysis</CardTitle>
                </div>
                <CardDescription>Detect suspicious patterns in today's attendance data.</CardDescription>
              </CardHeader>
              <CardContent>
                <SuspiciousActivityChecker classItem={classItem} attendanceRecords={attendanceRecords} />
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                    <QrCodeIcon className="h-5 w-5 text-primary"/>
                    <CardTitle>Class QR Code</CardTitle>
                </div>
                <CardDescription>Students can scan this to mark attendance.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                 <div className="p-4 bg-white rounded-lg border">
                    <Image 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`}
                        width={200}
                        height={200}
                        alt="Class QR Code"
                        data-ai-hint="QR code"
                    />
                 </div>
                <p className="mt-4 text-xs text-muted-foreground text-center">This QR code directs students to the attendance page.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
