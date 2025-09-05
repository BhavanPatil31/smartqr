import { ArrowRight, BookUser, User } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
      <div className="flex flex-col items-center space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl font-headline">
          Welcome to QAttend
        </h1>
        <p className="max-w-[700px] text-muted-foreground md:text-xl">
          The smart, simple, and reliable way to track attendance.
        </p>
      </div>
      <div className="mt-12 grid max-w-4xl gap-8 md:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-4">
              <User className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>For Students</CardTitle>
                <CardDescription>Scan, attend, and track your progress.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <p>Access your class schedule, mark your attendance with a quick scan, and view your history anytime.</p>
          </CardContent>
          <div className="p-6 pt-0">
            <Button asChild className="w-full">
              <Link href="/student/dashboard">
                Enter as Student <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Card>
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-4">
              <BookUser className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>For Teachers</CardTitle>
                <CardDescription>Manage classes and monitor attendance.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <p>Create classes, generate QR codes, and get real-time insights into student attendance with ease.</p>
          </CardContent>
          <div className="p-6 pt-0">
            <Button asChild className="w-full">
              <Link href="/teacher/dashboard">
                Enter as Teacher <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
