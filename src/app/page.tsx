
import { ArrowRight, BookUser, Cpu, QrCode, User } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/Header';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background gradient-bg">
      <Header />
      <main className="flex-1">
        <section className="w-full py-20 md:py-32 lg:py-40 xl:py-56">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tighter text-foreground sm:text-6xl xl:text-7xl/none">
                  Seamless Attendance Tracking with QAttend
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  The smart, simple, and reliable way to manage attendance. Students scan a QR, and teachers get instant insights.
                </p>
              </div>
              <div className="flex flex-col gap-4 min-[400px]:flex-row justify-center pt-6">
                <Button asChild size="lg">
                  <Link href="/teacher/login">
                    Get Started as a Teacher
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/student/login">
                    Login as a Student
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">How It Works</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  QAttend simplifies attendance for everyone involved.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-4xl gap-8 py-12 lg:grid-cols-3">
               <div className="flex flex-col items-center text-center p-4">
                  <div className="bg-primary rounded-full p-4 mb-4">
                    <QrCode className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-bold">For Teachers</h3>
                  <p className="text-muted-foreground mt-2">
                    Create classes, generate a unique QR code, and watch the attendance list update in real-time.
                  </p>
                </div>
                 <div className="flex flex-col items-center text-center p-4">
                   <div className="bg-primary rounded-full p-4 mb-4">
                    <User className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-bold">For Students</h3>
                  <p className="text-muted-foreground mt-2">
                    Simply open the app, scan the QR code for your class, and you're marked present. It's that easy.
                  </p>
                </div>
                 <div className="flex flex-col items-center text-center p-4">
                   <div className="bg-primary rounded-full p-4 mb-4">
                    <Cpu className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-bold">AI-Powered Insights</h3>
                  <p className="text-muted-foreground mt-2">
                    Our system automatically flags suspicious check-ins, helping maintain the integrity of your attendance records.
                  </p>
                </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary/20">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                Ready to Simplify Attendance?
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Choose your role and get started in just a few clicks.
              </p>
            </div>
             <div className="mt-12 grid max-w-4xl gap-8 md:grid-cols-2 mx-auto">
                <Card className="flex flex-col text-left hover:shadow-xl transition-shadow bg-card/50">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="bg-primary rounded-md p-3 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <CardTitle className="text-2xl">Students</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-muted-foreground">Access your class schedule, mark attendance with a quick scan, and view your history.</p>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link href="/student/login">
                        Student Login <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
                <Card className="flex flex-col text-left hover:shadow-xl transition-shadow bg-card/50">
                  <CardHeader>
                     <div className="flex items-center gap-4">
                      <div className="bg-primary rounded-md p-3 flex items-center justify-center">
                        <BookUser className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <CardTitle className="text-2xl">Teachers</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-muted-foreground">Manage classes, generate QR codes, and get real-time insights into student attendance.</p>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link href="/teacher/login">
                        Teacher Login <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t border-border/50">
        <p className="text-xs text-muted-foreground">&copy; 2024 QAttend. All rights reserved.</p>
      </footer>
    </div>
  );
}
