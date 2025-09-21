"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
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
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  ChevronLeft, 
  Settings, 
  User, 
  Bell, 
  Target,
  Shield,
  Activity,
  Save,
  LogOut
} from 'lucide-react';
import Link from 'next/link';
import type { StudentProfile } from '@/lib/data';
import { Header } from '@/components/Header';

const DEPARTMENTS = ["Computer Science", "Electronics", "Mechanical", "Civil", "Biotechnology"];
const SEMESTERS = ["1st Semester", "2nd Semester", "3rd Semester", "4th Semester", "5th Semester", "6th Semester", "7th Semester", "8th Semester"];

interface StudentSettings {
  profile: StudentProfile;
  emergencyContact: string;
  emergencyPhone: string;
  attendanceGoal: number;
  attendanceReminders: boolean;
  liveMode: boolean;
  autoRefreshInterval: number;
  emailNotifications: boolean;
  classReminders: boolean;
  weeklyReports: boolean;
  profileVisibility: 'public' | 'classmates' | 'private';
  allowTeacherMessages: boolean;
  parentAccess: boolean;
}

export default function StudentSettingsPage() {
  const [user, authLoading] = useAuthState(auth);
  const router = useRouter();
  const { toast } = useToast();

  const [settings, setSettings] = useState<StudentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSave, setAutoSave] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/student/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchSettings = async () => {
      if (user) {
        setLoading(true);
        try {
          const profileRef = doc(db, 'students', user.uid);
          const profileSnap = await getDoc(profileRef);
          
          const settingsRef = doc(db, 'studentSettings', user.uid);
          const settingsSnap = await getDoc(settingsRef);
          
          const profile = profileSnap.exists() 
            ? profileSnap.data() as StudentProfile
            : {
                fullName: user.displayName || 'Student',
                usn: '',
                email: user.email || '',
                phoneNumber: '',
                semester: '',
                department: '',
              };

          const defaultSettings: StudentSettings = {
            profile,
            emergencyContact: '',
            emergencyPhone: '',
            attendanceGoal: 85,
            attendanceReminders: true,
            liveMode: true,
            autoRefreshInterval: 10,
            emailNotifications: true,
            classReminders: true,
            weeklyReports: true,
            profileVisibility: 'classmates',
            allowTeacherMessages: true,
            parentAccess: false,
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
  }, [user, toast]);

  const handleSave = useCallback(async (showToast = true) => {
    if (!user || !settings) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'students', user.uid), settings.profile);
      
      const { profile, ...settingsData } = settings;
      await setDoc(doc(db, 'studentSettings', user.uid), settingsData);
      
      setLastSaved(new Date());
      if (showToast) {
        toast({ title: 'Success', description: 'Settings saved successfully!' });
      }
    } catch (error) {
      if (showToast) {
        toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' });
      }
      console.error("Error saving settings: ", error);
    } finally {
      setIsSaving(false);
    }
  }, [user, settings, toast]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !settings || !user) return;
    
    const timeoutId = setTimeout(() => {
      handleSave(false); // Save without showing toast
    }, 2000); // Auto-save after 2 seconds of inactivity
    
    return () => clearTimeout(timeoutId);
  }, [settings, autoSave, handleSave, user]);

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
          userType="student"
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

  const isProfileComplete = !!(settings.profile.department && settings.profile.semester);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header 
        onLogout={handleLogout} 
        user={user}
        userType="student"
        userProfile={settings.profile}
      />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent flex items-center gap-3">
                <Settings className="h-8 w-8 text-slate-700" />
                Student Settings
              </h1>
              <p className="text-slate-600 text-lg mt-2">
                Customize your learning experience and preferences
              </p>
              <div className="flex items-center gap-2 mt-2">
                {isProfileComplete ? (
                  <Badge variant="secondary" className="bg-green-50 text-green-700">
                    Profile Complete
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    Profile Incomplete
                  </Badge>
                )}
                <Badge variant="outline">
                  Goal: {settings.attendanceGoal}% Attendance
                </Badge>
                {lastSaved && (
                  <Badge variant="secondary" className="bg-green-50 text-green-700">
                    <Activity className="h-3 w-3 mr-1" />
                    Last saved: {lastSaved.toLocaleTimeString()}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={autoSave}
                  onCheckedChange={setAutoSave}
                  id="auto-save"
                />
                <Label htmlFor="auto-save" className="text-sm">
                  Auto-save
                </Label>
              </div>
              <Button onClick={() => handleSave(true)} disabled={isSaving} size="lg" className="gap-2">
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save All Changes'}
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="attendance" className="gap-2">
                <Target className="h-4 w-4" />
                Attendance
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="privacy" className="gap-2">
                <Shield className="h-4 w-4" />
                Privacy
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                    <CardDescription>
                      Update your personal and academic details
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
                      <Label htmlFor="usn">USN (University Seat Number)</Label>
                      <Input
                        id="usn"
                        value={settings.profile.usn}
                        onChange={(e) => handleProfileChange('usn', e.target.value)}
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
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Academic Information</CardTitle>
                    <CardDescription>
                      Your department and semester details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                    <div className="space-y-2">
                      <Label htmlFor="semester">Current Semester</Label>
                      <Select
                        value={settings.profile.semester}
                        onValueChange={(value) => handleProfileChange('semester', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Semester" />
                        </SelectTrigger>
                        <SelectContent>
                          {SEMESTERS.map(sem => (
                            <SelectItem key={sem} value={sem}>{sem}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                      <Input
                        id="emergencyContact"
                        value={settings.emergencyContact}
                        onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                        placeholder="Parent/Guardian name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                      <Input
                        id="emergencyPhone"
                        type="tel"
                        value={settings.emergencyPhone}
                        onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                        placeholder="Emergency contact number"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="attendance" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Attendance Goals
                    </CardTitle>
                    <CardDescription>
                      Set your attendance targets and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label>Attendance Goal: {settings.attendanceGoal}%</Label>
                      <Slider
                        value={[settings.attendanceGoal]}
                        onValueChange={(value) => handleInputChange('attendanceGoal', value[0])}
                        max={100}
                        min={50}
                        step={5}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>50%</span>
                        <span>75% (Minimum)</span>
                        <span>100%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Attendance Reminders</Label>
                        <p className="text-sm text-muted-foreground">
                          Get reminded to mark attendance
                        </p>
                      </div>
                      <Switch
                        checked={settings.attendanceReminders}
                        onCheckedChange={(checked) => handleInputChange('attendanceReminders', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Live Mode Settings
                    </CardTitle>
                    <CardDescription>
                      Configure real-time attendance tracking
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Live Mode</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable real-time attendance updates
                        </p>
                      </div>
                      <Switch
                        checked={settings.liveMode}
                        onCheckedChange={(checked) => handleInputChange('liveMode', checked)}
                      />
                    </div>
                    {settings.liveMode && (
                      <div className="space-y-3">
                        <Label>Auto-refresh Interval: {settings.autoRefreshInterval} seconds</Label>
                        <Slider
                          value={[settings.autoRefreshInterval]}
                          onValueChange={(value) => handleInputChange('autoRefreshInterval', value[0])}
                          max={60}
                          min={5}
                          step={5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>5s (Fast)</span>
                          <span>30s (Balanced)</span>
                          <span>60s (Slow)</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Notification Preferences
                    </CardTitle>
                    <CardDescription>
                      Configure how you receive notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive updates via email
                        </p>
                      </div>
                      <Switch
                        checked={settings.emailNotifications}
                        onCheckedChange={(checked) => handleInputChange('emailNotifications', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Class Reminders</Label>
                        <p className="text-sm text-muted-foreground">
                          Get reminded before classes start
                        </p>
                      </div>
                      <Switch
                        checked={settings.classReminders}
                        onCheckedChange={(checked) => handleInputChange('classReminders', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Weekly Reports</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive weekly attendance summaries
                        </p>
                      </div>
                      <Switch
                        checked={settings.weeklyReports}
                        onCheckedChange={(checked) => handleInputChange('weeklyReports', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Privacy Settings
                    </CardTitle>
                    <CardDescription>
                      Control who can see your information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>Profile Visibility</Label>
                      <Select
                        value={settings.profileVisibility}
                        onValueChange={(value: 'public' | 'classmates' | 'private') => 
                          handleInputChange('profileVisibility', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public (Everyone)</SelectItem>
                          <SelectItem value="classmates">Classmates Only</SelectItem>
                          <SelectItem value="private">Private (Hidden)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Allow Teacher Messages</Label>
                        <p className="text-sm text-muted-foreground">
                          Let teachers send you messages
                        </p>
                      </div>
                      <Switch
                        checked={settings.allowTeacherMessages}
                        onCheckedChange={(checked) => handleInputChange('allowTeacherMessages', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Parent Access</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow parents to view your attendance
                        </p>
                      </div>
                      <Switch
                        checked={settings.parentAccess}
                        onCheckedChange={(checked) => handleInputChange('parentAccess', checked)}
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
