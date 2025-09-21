
import { ArrowRight, BookUser, Cpu, QrCode, User, Shield, Sparkles, Zap, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/Header';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background gradient-bg overflow-hidden">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-20 md:py-32 lg:py-40 xl:py-56 overflow-hidden gradient-hero">
          {/* Floating Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-purple-400/20 to-purple-600/20 rounded-full animate-float-slow"></div>
            <div className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-full animate-float-medium"></div>
            <div className="absolute bottom-40 left-1/4 w-12 h-12 bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-full animate-float-fast"></div>
            <div className="absolute bottom-20 right-1/3 w-24 h-24 bg-gradient-to-br from-pink-400/20 to-pink-600/20 rounded-full animate-float-slow"></div>
            <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-gradient-to-br from-yellow-400/10 to-orange-400/10 rounded-full animate-float-medium"></div>
          </div>
          
          <div className="container px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center space-y-6 text-center">
              <div className="space-y-6 animate-fade-in-up">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 text-purple-700 font-medium animate-pulse-slow shadow-lg backdrop-blur-sm">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  AI-Powered Attendance System
                </div>
                
                <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl xl:text-7xl/none gradient-text animate-fade-in-up-delay">
                  Seamless Attendance Tracking with{' '}
                  <span className="relative inline-block">
                    SmartQR
                    <div className="absolute -bottom-2 left-0 right-0 h-4 bg-gradient-to-r from-purple-500/40 via-blue-500/30 to-green-500/20 rounded-full animate-pulse"></div>
                  </span>
                </h1>
                
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl animate-fade-in-up-delay-2">
                  The smart, simple, and reliable way to manage attendance. Students scan a QR, and teachers get instant insights with AI-powered analytics.
                </p>
              </div>
              
              <div className="flex flex-col gap-4 min-[400px]:flex-row justify-center pt-8 animate-fade-in-up-delay-3">
                <Button asChild size="lg" className="group hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0">
                  <Link href="/teacher/login">
                    Get Started as a Teacher
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary" className="group hover:scale-105 transition-all duration-300 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl">
                  <Link href="/student/login">
                    Login as a Student
                    <Zap className="ml-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 relative">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-6 text-center">
              <div className="space-y-4 animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 text-green-700 font-medium shadow-lg backdrop-blur-sm">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl gradient-text">
                  How It Works
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  SmartQR simplifies attendance for everyone involved with cutting-edge technology.
                </p>
              </div>
            </div>
            
            <div className="mx-auto grid max-w-6xl gap-8 py-16 lg:grid-cols-3">
              <div className="group flex flex-col items-center text-center p-8 rounded-3xl bg-white/80 backdrop-blur-sm border border-purple-200/60 hover:border-purple-400/80 hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 hover:-translate-y-3 animate-fade-in-up-delay relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-purple-100/30 opacity-50"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-purple-600/5 rounded-full -translate-y-16 translate-x-16"></div>
                
                <div className="relative mb-6 z-10">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-3xl p-6 group-hover:scale-110 transition-transform duration-300 shadow-xl group-hover:shadow-2xl">
                    <QrCode className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-purple-600 transition-colors">For Teachers</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    Create classes, generate unique QR codes, and monitor attendance in real-time with instant notifications and detailed analytics.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">Real-time Updates</span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">QR Generation</span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">Analytics</span>
                  </div>
                </div>
              </div>
              
              <div className="group flex flex-col items-center text-center p-8 rounded-3xl bg-white/80 backdrop-blur-sm border border-blue-200/60 hover:border-blue-400/80 hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-500 hover:-translate-y-3 animate-fade-in-up-delay-2 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-blue-100/30 opacity-50"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-blue-600/5 rounded-full -translate-y-16 translate-x-16"></div>
                
                <div className="relative mb-6 z-10">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl p-6 group-hover:scale-110 transition-transform duration-300 shadow-xl group-hover:shadow-2xl">
                    <User className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-blue-600 transition-colors">For Students</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    Simply scan the QR code for your class and you're marked present instantly. Track your attendance history and view detailed reports.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Quick Scan</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">History Tracking</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Secure</span>
                  </div>
                </div>
              </div>
              
              <div className="group flex flex-col items-center text-center p-8 rounded-3xl bg-white/80 backdrop-blur-sm border border-emerald-200/60 hover:border-emerald-400/80 hover:shadow-2xl hover:shadow-emerald-500/25 transition-all duration-500 hover:-translate-y-3 animate-fade-in-up-delay-3 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 opacity-50"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-emerald-600/5 rounded-full -translate-y-16 translate-x-16"></div>
                
                <div className="relative mb-6 z-10">
                  <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl p-6 group-hover:scale-110 transition-transform duration-300 shadow-xl group-hover:shadow-2xl">
                    <Cpu className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-emerald-600 transition-colors">AI-Powered Insights</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    Advanced AI algorithms automatically detect suspicious patterns, generate comprehensive reports, and provide actionable insights for better attendance management.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">Pattern Detection</span>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">Smart Reports</span>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">AI Analytics</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-purple-50/50 via-blue-50/30 to-emerald-50/50 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.1),transparent_50%)]"></div>
          </div>
          
          <div className="container grid items-center justify-center gap-8 px-4 text-center md:px-6 relative z-10">
            <div className="space-y-6 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 text-orange-700 font-medium shadow-lg backdrop-blur-sm">
                <Sparkles className="w-5 h-5 text-orange-600" />
                Get Started Today
              </div>
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight gradient-text">
                Ready to Simplify Attendance?
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Choose your role and get started in just a few clicks. Experience the future of attendance management.
              </p>
            </div>
            
            <div className="mt-16 grid max-w-6xl gap-8 md:grid-cols-3 mx-auto">
              <Card className="group flex flex-col text-left hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-500 bg-white/90 backdrop-blur-sm border-blue-200/60 hover:border-blue-400/80 hover:-translate-y-3 animate-fade-in-up-delay relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-blue-100/30 opacity-60"></div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-blue-600/5 rounded-full -translate-y-12 translate-x-12"></div>
                
                <CardHeader className="pb-4 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-xl group-hover:shadow-2xl">
                      <User className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl group-hover:text-blue-600 transition-colors">Students</CardTitle>
                      <p className="text-sm text-muted-foreground">Access your dashboard</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow pb-4 relative z-10">
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Access your class schedule, mark attendance with a quick scan, and view your detailed history with analytics.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>View class schedules</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Track attendance history</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Get detailed analytics</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-4 relative z-10">
                  <Button asChild className="w-full group-hover:scale-105 transition-transform duration-300 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl">
                    <Link href="/student/login">
                      Student Login <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="group flex flex-col text-left hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 bg-white/90 backdrop-blur-sm border-purple-200/60 hover:border-purple-400/80 hover:-translate-y-3 animate-fade-in-up-delay-2 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-purple-100/30 opacity-60"></div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400/10 to-purple-600/5 rounded-full -translate-y-12 translate-x-12"></div>
                
                <CardHeader className="pb-4 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-xl group-hover:shadow-2xl">
                      <BookUser className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl group-hover:text-purple-600 transition-colors">Teachers</CardTitle>
                      <p className="text-sm text-muted-foreground">Manage your classes</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow pb-4 relative z-10">
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Manage classes, generate QR codes, and get real-time insights into student attendance with AI-powered analytics.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Create and manage classes</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Generate QR codes</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Real-time analytics</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-4 relative z-10">
                  <Button asChild className="w-full group-hover:scale-105 transition-transform duration-300 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl">
                    <Link href="/teacher/login">
                      Teacher Login <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="group flex flex-col text-left hover:shadow-2xl hover:shadow-emerald-500/25 transition-all duration-500 bg-white/90 backdrop-blur-sm border-emerald-200/60 hover:border-emerald-400/80 hover:-translate-y-3 animate-fade-in-up-delay-3 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 opacity-60"></div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-400/10 to-emerald-600/5 rounded-full -translate-y-12 translate-x-12"></div>
                
                <CardHeader className="pb-4 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-xl group-hover:shadow-2xl">
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl group-hover:text-emerald-600 transition-colors">Admins</CardTitle>
                      <p className="text-sm text-muted-foreground">Oversee departments</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow pb-4 relative z-10">
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Oversee departmental data, including student, teacher, and class information for HODs with comprehensive dashboards.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span>Department oversight</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span>Comprehensive reports</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span>Advanced analytics</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-4 relative z-10">
                  <Button asChild className="w-full group-hover:scale-105 transition-transform duration-300 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl">
                    <Link href="/admin/login">
                      Admin Login <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 SmartQR. All rights reserved.</p>
      </footer>
    </div>
  );
}
