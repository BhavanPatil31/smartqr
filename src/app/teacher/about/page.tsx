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
import type { TeacherProfile } from '@/lib/data';

export default function TeacherAboutPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [profile, setProfile] = useState<TeacherProfile | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/teacher/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const docRef = doc(db, 'teachers', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProfile(docSnap.data() as TeacherProfile);
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
        userType="teacher"
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
                Empowering educators with smart attendance solutions
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
                <h2 className="text-3xl font-bold text-slate-900">Empowering Educators</h2>
                <p className="text-lg text-slate-700 max-w-3xl mx-auto">
                  SmartQR transforms classroom management by providing teachers with powerful tools 
                  to track attendance effortlessly, generate insightful reports, and focus on what 
                  matters most - teaching and student engagement.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Teacher-Specific Features */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Smartphone className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">One-Click QR Generation</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Generate unique QR codes for each class session instantly. 
                  Display them on any screen for students to scan quickly.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">Comprehensive Reports</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Access detailed attendance analytics, export data, and track 
                  student participation patterns across all your classes.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl">Class Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Organize multiple classes, set schedules, manage student lists, 
                  and handle attendance corrections with ease.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-full">
                    <Clock className="h-6 w-6 text-red-600" />
                  </div>
                  <CardTitle className="text-xl">Real-time Monitoring</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Monitor attendance as it happens with live updates. 
                  See which students have marked their attendance instantly.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-full">
                    <Shield className="h-6 w-6 text-yellow-600" />
                  </div>
                  <CardTitle className="text-xl">Secure & Reliable</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Time-limited QR codes prevent fraud. All data is encrypted 
                  and backed up automatically for complete peace of mind.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-full">
                    <Award className="h-6 w-6 text-indigo-600" />
                  </div>
                  <CardTitle className="text-xl">Student Engagement</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Send notifications to students, track engagement patterns, 
                  and identify students who need additional support.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Benefits for Teachers */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-blue-50">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Why Teachers Love SmartQR</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 text-center">
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-green-600">90%</div>
                  <div className="text-slate-600">Time Saved</div>
                  <div className="text-xs text-slate-500">vs traditional methods</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-blue-600">Zero</div>
                  <div className="text-slate-600">Paper Waste</div>
                  <div className="text-xs text-slate-500">completely digital</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-purple-600">100%</div>
                  <div className="text-slate-600">Accuracy</div>
                  <div className="text-xs text-slate-500">no manual errors</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-orange-600">24/7</div>
                  <div className="text-slate-600">Access</div>
                  <div className="text-xs text-slate-500">anytime, anywhere</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How It Works for Teachers */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Lightbulb className="h-6 w-6 text-yellow-600" />
                How SmartQR Works for Teachers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-4">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-blue-100 rounded-full">
                      <span className="text-2xl font-bold text-blue-600">1</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold">Create Class</h3>
                  <p className="text-slate-600 text-sm">
                    Set up your class with subject details and schedule
                  </p>
                </div>
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-green-100 rounded-full">
                      <span className="text-2xl font-bold text-green-600">2</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold">Generate QR</h3>
                  <p className="text-slate-600 text-sm">
                    Click to generate a unique QR code for the session
                  </p>
                </div>
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-purple-100 rounded-full">
                      <span className="text-2xl font-bold text-purple-600">3</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold">Display Code</h3>
                  <p className="text-slate-600 text-sm">
                    Show the QR code to students for scanning
                  </p>
                </div>
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-orange-100 rounded-full">
                      <span className="text-2xl font-bold text-orange-600">4</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold">Track & Report</h3>
                  <p className="text-slate-600 text-sm">
                    Monitor attendance and generate reports instantly
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
                  Built for Educators
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600">
                  SmartQR is designed by educators, for educators. Every feature 
                  is crafted to make classroom management more efficient and effective.
                </p>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-sm text-slate-600 ml-2">Rated by educators worldwide</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-green-600 to-blue-600 text-white">
            <CardContent className="p-8 text-center space-y-4">
              <h2 className="text-2xl font-bold">Ready to Transform Your Classroom?</h2>
              <p className="text-green-100 max-w-2xl mx-auto">
                Join thousands of educators who have revolutionized their attendance management 
                with SmartQR. Start creating more engaging and efficient classrooms today.
              </p>
              <div className="flex gap-4 justify-center">
                <Button asChild variant="secondary" size="lg" className="gap-2">
                  <Link href="/teacher/dashboard">
                    <BarChart3 className="h-4 w-4" />
                    View Dashboard
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <Link href="/teacher/help">
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
