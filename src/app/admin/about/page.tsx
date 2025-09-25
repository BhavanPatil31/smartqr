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
  Star,
  Settings,
  Database,
  Lock
} from 'lucide-react';
import Link from 'next/link';
import type { AdminProfile } from '@/lib/data';

export default function AdminAboutPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [profile, setProfile] = useState<AdminProfile | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/admin/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const docRef = doc(db, 'admins', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProfile(docSnap.data() as AdminProfile);
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
        userType="admin"
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
                Comprehensive attendance management for institutions
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
                <h2 className="text-3xl font-bold text-slate-900">Institutional Excellence</h2>
                <p className="text-lg text-slate-700 max-w-3xl mx-auto">
                  SmartQR provides administrators with comprehensive oversight and control over 
                  attendance management across departments, enabling data-driven decisions and 
                  streamlined institutional operations.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Admin-Specific Features */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Database className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">Centralized Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Manage all departments, teachers, and students from a single dashboard. 
                  Complete oversight of institutional attendance data.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">Advanced Analytics</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Access department-wide analytics, trend analysis, and comprehensive 
                  reports for informed decision-making and policy development.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl">User Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Approve teacher registrations, manage student accounts, and 
                  maintain institutional user hierarchy with role-based access.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-full">
                    <Shield className="h-6 w-6 text-red-600" />
                  </div>
                  <CardTitle className="text-xl">Security & Compliance</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Enterprise-grade security with audit trails, data backup, 
                  and compliance with educational data protection standards.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-full">
                    <Settings className="h-6 w-6 text-yellow-600" />
                  </div>
                  <CardTitle className="text-xl">System Configuration</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Configure system-wide settings, attendance policies, 
                  notification preferences, and institutional parameters.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-full">
                    <Award className="h-6 w-6 text-indigo-600" />
                  </div>
                  <CardTitle className="text-xl">Performance Monitoring</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Monitor system performance, track usage statistics, and 
                  identify trends to optimize institutional processes.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Administrative Benefits */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-blue-50">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Administrative Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 text-center">
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-green-600">95%</div>
                  <div className="text-slate-600">Process Efficiency</div>
                  <div className="text-xs text-slate-500">administrative tasks</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-blue-600">100%</div>
                  <div className="text-slate-600">Data Accuracy</div>
                  <div className="text-xs text-slate-500">automated tracking</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-purple-600">24/7</div>
                  <div className="text-slate-600">System Monitoring</div>
                  <div className="text-xs text-slate-500">continuous oversight</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-orange-600">Zero</div>
                  <div className="text-slate-600">Manual Errors</div>
                  <div className="text-xs text-slate-500">automated processes</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Workflow */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Lightbulb className="h-6 w-6 text-yellow-600" />
                Administrative Workflow
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
                  <h3 className="text-lg font-semibold">Setup & Configure</h3>
                  <p className="text-slate-600 text-sm">
                    Configure departments, approve users, and set system policies
                  </p>
                </div>
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-green-100 rounded-full">
                      <span className="text-2xl font-bold text-green-600">2</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold">Monitor Operations</h3>
                  <p className="text-slate-600 text-sm">
                    Oversee daily attendance activities and system performance
                  </p>
                </div>
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-purple-100 rounded-full">
                      <span className="text-2xl font-bold text-purple-600">3</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold">Analyze Data</h3>
                  <p className="text-slate-600 text-sm">
                    Review analytics and generate institutional reports
                  </p>
                </div>
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-orange-100 rounded-full">
                      <span className="text-2xl font-bold text-orange-600">4</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold">Optimize & Scale</h3>
                  <p className="text-slate-600 text-sm">
                    Make data-driven decisions to improve processes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Features */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-red-50 to-orange-50">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Lock className="h-6 w-6 text-red-600" />
                Enterprise Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-center gap-3 p-4 bg-white/50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-slate-700">End-to-end encryption</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white/50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-slate-700">Role-based access control</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white/50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-slate-700">Audit trail logging</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white/50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-slate-700">Automated backups</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white/50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-slate-700">GDPR compliance</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white/50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-slate-700">Multi-factor authentication</span>
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
                  Enterprise Ready
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600">
                  SmartQR is built for institutional scale with enterprise-grade 
                  security, reliability, and comprehensive administrative controls.
                </p>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-sm text-slate-600 ml-2">Trusted by institutions globally</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <CardContent className="p-8 text-center space-y-4">
              <h2 className="text-2xl font-bold">Ready to Scale Your Institution?</h2>
              <p className="text-purple-100 max-w-2xl mx-auto">
                Join leading educational institutions worldwide that trust SmartQR for 
                comprehensive attendance management and institutional excellence.
              </p>
              <div className="flex gap-4 justify-center">
                <Button asChild variant="secondary" size="lg" className="gap-2">
                  <Link href="/admin/dashboard">
                    <BarChart3 className="h-4 w-4" />
                    View Dashboard
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <Link href="/admin/help">
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
