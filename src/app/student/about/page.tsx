"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Info, 
  Shield, 
  Zap, 
  Users, 
  Target,
  Award,
  CheckCircle,
  Smartphone,
  Clock,
  BarChart3,
  Globe,
  Heart,
  Code,
  Lightbulb,
  Star
} from 'lucide-react';
import Link from 'next/link';
import type { StudentProfile } from '@/lib/data';

export default function StudentAboutPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/student/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const docRef = doc(db, 'students', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProfile(docSnap.data() as StudentProfile);
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
  };

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header 
        onLogout={handleLogout} 
        user={user}
        userType="student"
        userProfile={profile}
      />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Info className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                About SmartQR
              </h1>
              <p className="text-slate-600 text-lg mt-2">
                Modern attendance management made simple
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Mission Statement */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-blue-100 rounded-full">
                    <Target className="h-12 w-12 text-blue-600" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-slate-900">Our Mission</h2>
                <p className="text-lg text-slate-700 max-w-3xl mx-auto">
                  SmartQR revolutionizes attendance management by providing a seamless, secure, and efficient 
                  QR code-based system that saves time for both students and educators while ensuring accurate 
                  attendance tracking.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Key Features */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Smartphone className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">Easy QR Scanning</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Simply scan QR codes with your smartphone camera to mark attendance instantly. 
                  No complex procedures or additional hardware required.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">Real-time Updates</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Get instant updates on your attendance status with live tracking and 
                  immediate confirmation when attendance is marked.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl">Detailed Analytics</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Track your attendance patterns with comprehensive analytics, 
                  subject-wise breakdowns, and progress monitoring.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-full">
                    <Shield className="h-6 w-6 text-red-600" />
                  </div>
                  <CardTitle className="text-xl">Secure & Private</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Your data is protected with enterprise-grade security. 
                  Only authorized personnel can access attendance records.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-full">
                    <Zap className="h-6 w-6 text-yellow-600" />
                  </div>
                  <CardTitle className="text-xl">Lightning Fast</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Mark attendance in seconds with our optimized QR scanning technology. 
                  No waiting, no delays, just instant results.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-full">
                    <Users className="h-6 w-6 text-indigo-600" />
                  </div>
                  <CardTitle className="text-xl">Multi-User Support</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Designed for students, teachers, and administrators with 
                  role-based access and customized dashboards for each user type.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Statistics */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-blue-50">
            <CardHeader>
              <CardTitle className="text-2xl text-center">SmartQR by the Numbers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-4 text-center">
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-green-600">99.9%</div>
                  <div className="text-slate-600">Accuracy Rate</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-blue-600">5 sec</div>
                  <div className="text-slate-600">Average Scan Time</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-purple-600">24/7</div>
                  <div className="text-slate-600">System Availability</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-orange-600">100%</div>
                  <div className="text-slate-600">Data Security</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Lightbulb className="h-6 w-6 text-yellow-600" />
                How SmartQR Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-blue-100 rounded-full">
                      <span className="text-2xl font-bold text-blue-600">1</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold">Teacher Generates QR</h3>
                  <p className="text-slate-600">
                    Your teacher creates a unique QR code for each class session
                  </p>
                </div>
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-green-100 rounded-full">
                      <span className="text-2xl font-bold text-green-600">2</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold">You Scan the Code</h3>
                  <p className="text-slate-600">
                    Use your smartphone to scan the displayed QR code quickly
                  </p>
                </div>
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-purple-100 rounded-full">
                      <span className="text-2xl font-bold text-purple-600">3</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold">Attendance Recorded</h3>
                  <p className="text-slate-600">
                    Your attendance is instantly recorded and updated in real-time
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Version Information */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-slate-600" />
                  Version Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Current Version</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    v2.1.0
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Release Date</span>
                  <span className="text-slate-900">December 2024</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Platform</span>
                  <span className="text-slate-900">Web Application</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Technology</span>
                  <span className="text-slate-900">Next.js + Firebase</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-600" />
                  Made with Care
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600">
                  SmartQR is developed with students and educators in mind, 
                  focusing on simplicity, reliability, and user experience.
                </p>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-sm text-slate-600 ml-2">Trusted by thousands</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="p-8 text-center space-y-4">
              <h2 className="text-2xl font-bold">Ready to Get Started?</h2>
              <p className="text-blue-100 max-w-2xl mx-auto">
                Experience the future of attendance management. Join thousands of students 
                who are already using SmartQR to track their academic progress.
              </p>
              <div className="flex gap-4 justify-center">
                <Button asChild variant="secondary" size="lg" className="gap-2">
                  <Link href="/student/dashboard">
                    <BarChart3 className="h-4 w-4" />
                    View Dashboard
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <Link href="/student/help">
                    <Info className="h-4 w-4" />
                    Get Help
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
