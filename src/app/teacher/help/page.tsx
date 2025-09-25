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
import { Separator } from '@/components/ui/separator';
import { 
  Mail, 
  Phone, 
  MessageCircle, 
  HelpCircle, 
  Book, 
  Video, 
  FileText, 
  Users, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import Link from 'next/link';
import type { TeacherProfile } from '@/lib/data';

export default function TeacherHelpPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

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

  const copyToClipboard = async (text: string, type: 'email' | 'phone') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'email') {
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
      } else {
        setCopiedPhone(true);
        setTimeout(() => setCopiedPhone(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
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
              <HelpCircle className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                Help & Support
              </h1>
              <p className="text-slate-600 text-lg mt-2">
                Get help with SmartQR attendance system
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Contact Information */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                  Contact Support
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-full">
                        <Mail className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-green-900">Email Support</p>
                        <p className="text-green-700 font-mono">support@smartqr.com</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard('support@smartqr.com', 'email')}
                      className="gap-2"
                    >
                      {copiedEmail ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copiedEmail ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Phone className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-blue-900">Phone Support</p>
                        <p className="text-blue-700 font-mono">+91 98765 43210</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard('+91 98765 43210', 'phone')}
                      className="gap-2"
                    >
                      {copiedPhone ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copiedPhone ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-900">Support Hours</p>
                      <p className="text-yellow-700 text-sm">
                        Monday - Friday: 9:00 AM - 6:00 PM IST<br />
                        Saturday: 10:00 AM - 4:00 PM IST<br />
                        Sunday: Closed
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button asChild className="flex-1 gap-2">
                    <a href="mailto:support@smartqr.com">
                      <Mail className="h-4 w-4" />
                      Send Email
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="flex-1 gap-2">
                    <a href="tel:+919876543210">
                      <Phone className="h-4 w-4" />
                      Call Now
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild variant="outline" className="w-full justify-start gap-3">
                  <Link href="/teacher/profile">
                    <Users className="h-4 w-4" />
                    Update Profile Information
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start gap-3">
                  <Link href="/teacher/settings">
                    <HelpCircle className="h-4 w-4" />
                    Account Settings
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start gap-3">
                  <Link href="/teacher/dashboard">
                    <FileText className="h-4 w-4" />
                    Manage Classes
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* FAQ and Resources */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Book className="h-5 w-5 text-purple-600" />
                  Frequently Asked Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-medium text-slate-900 mb-2">How do I create a new class?</h4>
                    <p className="text-slate-600 text-sm">
                      Go to your dashboard and click "Create Class". Fill in the class details and schedule information.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-medium text-slate-900 mb-2">How do I generate QR codes for attendance?</h4>
                    <p className="text-slate-600 text-sm">
                      In your class page, click "Generate QR Code". Display this code to students during class time.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-medium text-slate-900 mb-2">How can I view attendance reports?</h4>
                    <p className="text-slate-600 text-sm">
                      Go to your class page and click on "View Reports" to see detailed attendance statistics and export data.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-medium text-slate-900 mb-2">What if a student's attendance wasn't recorded?</h4>
                    <p className="text-slate-600 text-sm">
                      You can manually mark attendance for students who were present but couldn't scan the QR code.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-green-600" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Attendance System</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Operational
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">QR Code Generator</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Operational
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Real-time Updates</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Operational
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card className="border-0 shadow-lg bg-red-50 border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Emergency Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-700 text-sm mb-4">
                  For urgent issues during exams or critical attendance periods:
                </p>
                <div className="space-y-2">
                  <p className="text-red-800 font-medium">Emergency Hotline: +91 98765 43210</p>
                  <p className="text-red-700 text-sm">Available 24/7 during exam periods</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
