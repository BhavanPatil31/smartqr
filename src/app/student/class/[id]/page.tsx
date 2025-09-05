import { Header } from '@/components/Header';
import { AttendanceButton } from '@/components/AttendanceButton';
import { getClassById, getTeacherById } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, User } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export default function StudentClassPage({ params }: { params: { id: string } }) {
  const classItem = getClassById(params.id);

  if (!classItem) {
    notFound();
  }

  const teacher = getTeacherById(classItem.teacherId);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <Button asChild variant="ghost" className="mb-4">
              <Link href="/student/dashboard"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
          </Button>
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-2xl text-center font-headline">{classItem.subject}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-6">
              <div className="text-muted-foreground space-y-2 text-center">
                <p className="flex items-center justify-center gap-2"><User className="h-4 w-4" /> {teacher?.name}</p>
                <p className="flex items-center justify-center gap-2"><Clock className="h-4 w-4" /> {classItem.timeSlot.day}, {classItem.timeSlot.start} - {classItem.timeSlot.end}</p>
              </div>
              <AttendanceButton classTimeSlot={classItem.timeSlot} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
