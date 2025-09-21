"use client";

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  Settings, 
  User, 
  BookOpen, 
  Bell,
  Clock,
  QrCode,
  Save,
  LogOut,
  Shield,
  MessageSquare,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import type { TeacherProfile } from '@/lib/data';
import { Header } from '@/components/Header';

const DEPARTMENTS = ["Computer Science", "Electronics", "Mechanical", "Civil", "Biotechnology"];

interface TeacherSettings {
  // Profile
  profile: TeacherProfile;
  
  // Class Management
  defaultMaxStudents: number;
  defaultRoomPreference: string;
  qrCodeDuration: number; // minutes
  lateArrivalTolerance: number; // minutes
  autoAttendanceReminders: boolean;
  
  // Notifications
  emailNotifications: boolean;
  smsNotifications: boolean;
  attendanceAlerts: boolean;
  lowAttendanceWarnings: boolean;
  classReminderNotifications: boolean;
  
  // Communication
  allowStudentMessages: boolean;
  parentNotifications: boolean;
  weeklyReportsToParents: boolean;
  
  // Privacy & Security
  profileVisibility: 'public' | 'department' | 'private';
  shareContactInfo: boolean;
  
  // Teaching Preferences
  gradeBookIntegration: boolean;
  attendanceWeighting: number; // percentage
  minimumAttendanceForGrades: number; // percentage
}

export default function TeacherSettingsPage() {
  const [user, authLoading] = useAuthState(auth);
  const router = useRouter();
  const { toast } = useToast();

  const [settings, setSettings] = useState<TeacherSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/teacher/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchSettings = async () => {
      if (user) {
        setLoading(true);
        try {
          // Check if teacher is approved
          const teacherDocRef = doc(db, 'teachers', user.uid);
          const teacherDocSnap = await getDoc(teacherDocRef);
          
          if (teacherDocSnap.exists()) {
            const teacherData = teacherDocSnap.data();
            if (teacherData.isApproved !== true) {
              toast({ 
                title: 'Access Denied', 
                description: 'Your account is pending approval. Settings will be available after approval.', 
                variant: 'destructive' 
              });
              router.push('/teacher/pending-approval');
              return;
            }
          }

          // Fetch teacher profile
          const profileRef = doc(db, 'teachers', user.uid);
          const profileSnap = await getDoc(profileRef);
          
          // Fetch teacher settings
          const settingsRef = doc(db, 'teacherSettings', user.uid);
          const settingsSnap = await getDoc(settingsRef);
          
          const profile = profileSnap.exists() 
            ? profileSnap.data() as TeacherProfile
            : {
                fullName: user.displayName || 'Teacher',
                email: user.email || '',
                phoneNumber: '',
                department: '',
                isApproved: false,
                registeredAt: Date.now(),
              };

          const defaultSettings: TeacherSettings = {
            profile,
            defaultMaxStudents: 50,
            defaultRoomPreference: '',
            qrCodeDuration: 15,
            lateArrivalTolerance: 10,
            autoAttendanceReminders: true,
            emailNotifications: true,
            smsNotifications: false,
            attendanceAlerts: true,
            lowAttendanceWarnings: true,
            classReminderNotifications: true,
            allowStudentMessages: true,
            parentNotifications: false,
            weeklyReportsToParents: false,
            profileVisibility: 'department',
            shareContactInfo: false,
            gradeBookIntegration: false,
            attendanceWeighting: 20,
            minimumAttendanceForGrades: 75,
          };

          if (settingsSnap.exists()) {
            setSettings({ ...defaultSettings, ...settingsSnap.data(), profile });
          } else {
            setSettings(defaultSettings);
          }
        } catch (error) {
          console.error("Failed to fetch settings:", error);
          toast({ title: 'Error', description: 'Could not fetch settings.', variant: 'destructive' });
        } finally {
          setLoading(false);
        }
      }
    };

    if (user) {
      fetchSettings();
    }
  }, [user, toast, router]);

  const handleSave = async () => {
    if (!user || !settings) return;
    setIsSaving(true);
    try {
      // Save profile
      await setDoc(doc(db, 'teachers', user.uid), settings.profile);
      
      // Save settings (excluding profile)
      const { profile, ...settingsData } = settings;
      await setDoc(doc(db, 'teacherSettings', user.uid), settingsData);
      
      toast({ title: 'Success', description: 'Settings saved successfully!' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' });
      console.error("Error saving settings: ", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setSettings(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleProfileChange = (field: string, value: string) => {
    setSettings(prev => prev ? { 
      ...prev, 
      profile: { ...prev.profile, [field]: value } 
    } : null);
  };

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
  };

  if (authLoading || loading || !settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Header 
          onLogout={handleLogout} 
          user={user}
          userType="teacher"
        >
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-24" />
          </div>
        </Header>
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="space-y-6">
            <Skeleton className="h-10 w-64" />
            <div className="grid gap-6 lg:grid-cols-4">
              <Skeleton className="h-80 w-full lg:col-span-1" />
              <Skeleton className="h-80 w-full lg:col-span-3" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header 
        onLogout={handleLogout} 
        user={user}
        userType="teacher"
        userProfile={settings.profile}
      />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent flex items-center gap-3">
                <Settings className="h-8 w-8 text-slate-700" />
                Teacher Settings
              </h1>
              <p className="text-slate-600 text-lg mt-2">
                Customize your teaching preferences and account settings
              </p>
              {settings.profile.isApproved && (
                <Badge variant="secondary" className="mt-2 bg-green-50 text-green-700">
                  Account Approved
                </Badge>
              )}
            </div>
            <Button onClick={handleSave} disabled={isSaving} size="lg" className="gap-2">
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save All Changes'}
            </Button>
          </div>

          {/* Settings Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="classes" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Classes
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="communication" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Communication
              </TabsTrigger>
            </TabsList>

            {/* Profile Settings */}
            <TabsContent value="profile" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                    <CardDescription>
                      Update your personal and contact information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={settings.profile.fullName}
                        onChange={(e) => handleProfileChange('fullName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={settings.profile.email}
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        value={settings.profile.phoneNumber}
                        onChange={(e) => handleProfileChange('phoneNumber', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Select
                        value={settings.profile.department}
                        onValueChange={(value) => handleProfileChange('department', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEPARTMENTS.map(dept => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Privacy & Security
                    </CardTitle>
                    <CardDescription>
                      Control your profile visibility and data sharing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>Profile Visibility</Label>
                      <Select
                        value={settings.profileVisibility}
                        onValueChange={(value: 'public' | 'department' | 'private') => 
                          handleInputChange('profileVisibility', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public (All users)</SelectItem>
                          <SelectItem value="department">Department Only</SelectItem>
                          <SelectItem value="private">Private (Hidden)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Share Contact Information</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow students to see your contact details
                        </p>
                      </div>
                      <Switch
                        checked={settings.shareContactInfo}
                        onCheckedChange={(checked) => handleInputChange('shareContactInfo', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Class Management */}
            <TabsContent value="classes" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Class Defaults
                    </CardTitle>
                    <CardDescription>
                      Set default values for new classes you create
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxStudents">Default Maximum Students</Label>
                      <Input
                        id="maxStudents"
                        type="number"
                        min="1"
                        max="200"
                        value={settings.defaultMaxStudents}
                        onChange={(e) => handleInputChange('defaultMaxStudents', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="roomPreference">Preferred Room/Building</Label>
                      <Input
                        id="roomPreference"
                        value={settings.defaultRoomPreference}
                        onChange={(e) => handleInputChange('defaultRoomPreference', e.target.value)}
                        placeholder="e.g., Main Building, Lab Block"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <QrCode className="h-5 w-5" />
                      Attendance Settings
                    </CardTitle>
                    <CardDescription>
                      Configure QR code and attendance marking preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="qrDuration">QR Code Active Duration</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="qrDuration"
                          type="number"
                          min="1"
                          max="60"
                          value={settings.qrCodeDuration}
                          onChange={(e) => handleInputChange('qrCodeDuration', parseInt(e.target.value))}
                        />
                        <span className="text-sm text-muted-foreground">minutes</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lateTolerance">Late Arrival Tolerance</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="lateTolerance"
                          type="number"
                          min="0"
                          max="30"
                          value={settings.lateArrivalTolerance}
                          onChange={(e) => handleInputChange('lateArrivalTolerance', parseInt(e.target.value))}
                        />
                        <span className="text-sm text-muted-foreground">minutes</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto Attendance Reminders</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically remind students to mark attendance
                        </p>
                      </div>
                      <Switch
                        checked={settings.autoAttendanceReminders}
                        onCheckedChange={(checked) => handleInputChange('autoAttendanceReminders', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Grading Integration
                    </CardTitle>
                    <CardDescription>
                      Configure how attendance affects student grades
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Grade Book Integration</Label>
                        <p className="text-sm text-muted-foreground">
                          Include attendance in grade calculations
                        </p>
                      </div>
                      <Switch
                        checked={settings.gradeBookIntegration}
                        onCheckedChange={(checked) => handleInputChange('gradeBookIntegration', checked)}
                      />
                    </div>
                    {settings.gradeBookIntegration && (
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="attendanceWeight">Attendance Weight in Grades</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id="attendanceWeight"
                              type="number"
                              min="0"
                              max="100"
                              value={settings.attendanceWeighting}
                              onChange={(e) => handleInputChange('attendanceWeighting', parseInt(e.target.value))}
                            />
                            <span className="text-sm text-muted-foreground">%</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="minAttendanceGrade">Minimum Attendance for Grades</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id="minAttendanceGrade"
                              type="number"
                              min="0"
                              max="100"
                              value={settings.minimumAttendanceForGrades}
                              onChange={(e) => handleInputChange('minimumAttendanceForGrades', parseInt(e.target.value))}
                            />
                            <span className="text-sm text-muted-foreground">%</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Notifications */}
            <TabsContent value="notifications" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      General Notifications
                    </CardTitle>
                    <CardDescription>
                      Configure how you receive system notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications via email
                        </p>
                      </div>
                      <Switch
                        checked={settings.emailNotifications}
                        onCheckedChange={(checked) => handleInputChange('emailNotifications', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive critical alerts via SMS
                        </p>
                      </div>
                      <Switch
                        checked={settings.smsNotifications}
                        onCheckedChange={(checked) => handleInputChange('smsNotifications', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Class Reminder Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Get reminders before your classes start
                        </p>
                      </div>
                      <Switch
                        checked={settings.classReminderNotifications}
                        onCheckedChange={(checked) => handleInputChange('classReminderNotifications', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Attendance Alerts
                    </CardTitle>
                    <CardDescription>
                      Configure attendance-related notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Attendance Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when students mark attendance
                        </p>
                      </div>
                      <Switch
                        checked={settings.attendanceAlerts}
                        onCheckedChange={(checked) => handleInputChange('attendanceAlerts', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Low Attendance Warnings</Label>
                        <p className="text-sm text-muted-foreground">
                          Alert when students have low attendance
                        </p>
                      </div>
                      <Switch
                        checked={settings.lowAttendanceWarnings}
                        onCheckedChange={(checked) => handleInputChange('lowAttendanceWarnings', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Communication */}
            <TabsContent value="communication" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Student Communication
                    </CardTitle>
                    <CardDescription>
                      Configure how students can communicate with you
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Allow Student Messages</Label>
                        <p className="text-sm text-muted-foreground">
                          Let students send you messages through the platform
                        </p>
                      </div>
                      <Switch
                        checked={settings.allowStudentMessages}
                        onCheckedChange={(checked) => handleInputChange('allowStudentMessages', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Parent Communication
                    </CardTitle>
                    <CardDescription>
                      Configure communication with parents/guardians
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Parent Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Send attendance updates to parents
                        </p>
                      </div>
                      <Switch
                        checked={settings.parentNotifications}
                        onCheckedChange={(checked) => handleInputChange('parentNotifications', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Weekly Reports to Parents</Label>
                        <p className="text-sm text-muted-foreground">
                          Send weekly attendance summaries to parents
                        </p>
                      </div>
                      <Switch
                        checked={settings.weeklyReportsToParents}
                        onCheckedChange={(checked) => handleInputChange('weeklyReportsToParents', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
