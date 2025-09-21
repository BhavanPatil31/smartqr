"use client";

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
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
  Shield, 
  Database, 
  Users, 
  Bell,
  Save,
  Download,
  Upload,
  Trash2,
  Plus,
  Edit,
  LogOut
} from 'lucide-react';
import Link from 'next/link';
import type { AdminProfile } from '@/lib/data';
import { Header } from '@/components/Header';

const DEPARTMENTS = ["Computer Science", "Electronics", "Mechanical", "Civil", "Biotechnology"];
const SEMESTERS = ["1st Semester", "2nd Semester", "3rd Semester", "4th Semester", "5th Semester", "6th Semester", "7th Semester", "8th Semester"];

interface AdminSettings {
  // Account Settings
  profile: AdminProfile;
  twoFactorEnabled: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  
  // System Configuration
  minimumAttendancePercentage: number;
  attendanceMarkingWindow: number; // minutes
  autoApprovalEnabled: boolean;
  bulkImportEnabled: boolean;
  
  // Data Settings
  dataRetentionPeriod: number; // months
  autoBackupEnabled: boolean;
  analyticsEnabled: boolean;
  
  // Notification Settings
  approvalRequestNotifications: boolean;
  systemMaintenanceNotifications: boolean;
  weeklyReportsEnabled: boolean;
}

export default function AdminSettingsPage() {
  const [user, authLoading] = useAuthState(auth);
  const router = useRouter();
  const { toast } = useToast();

  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("account");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchSettings = async () => {
      if (user) {
        setLoading(true);
        try {
          // Fetch admin profile
          const profileRef = doc(db, 'admins', user.uid);
          const profileSnap = await getDoc(profileRef);
          
          // Fetch admin settings
          const settingsRef = doc(db, 'adminSettings', user.uid);
          const settingsSnap = await getDoc(settingsRef);
          
          const profile = profileSnap.exists() 
            ? profileSnap.data() as AdminProfile
            : {
                fullName: user.displayName || 'Admin',
                email: user.email || '',
                department: '',
              };

          const defaultSettings: AdminSettings = {
            profile,
            twoFactorEnabled: false,
            emailNotifications: true,
            smsNotifications: false,
            minimumAttendancePercentage: 75,
            attendanceMarkingWindow: 15,
            autoApprovalEnabled: false,
            bulkImportEnabled: true,
            dataRetentionPeriod: 24,
            autoBackupEnabled: true,
            analyticsEnabled: true,
            approvalRequestNotifications: true,
            systemMaintenanceNotifications: true,
            weeklyReportsEnabled: true,
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

  const handleSave = async () => {
    if (!user || !settings) return;
    setIsSaving(true);
    try {
      // Save profile
      await setDoc(doc(db, 'admins', user.uid), settings.profile);
      
      // Save settings (excluding profile)
      const { profile, ...settingsData } = settings;
      await setDoc(doc(db, 'adminSettings', user.uid), settingsData);
      
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
          userType="admin"
          isAdmin={true}
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
        userType="admin"
        userProfile={settings.profile}
        isAdmin={true}
      />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent flex items-center gap-3">
                <Settings className="h-8 w-8 text-slate-700" />
                Admin Settings
              </h1>
              <p className="text-slate-600 text-lg mt-2">
                Manage your account, system configuration, and preferences
              </p>
            </div>
            <Button onClick={handleSave} disabled={isSaving} size="lg" className="gap-2">
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save All Changes'}
            </Button>
          </div>

          {/* Settings Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
              <TabsTrigger value="account" className="gap-2">
                <User className="h-4 w-4" />
                Account
              </TabsTrigger>
              <TabsTrigger value="system" className="gap-2">
                <Settings className="h-4 w-4" />
                System
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="data" className="gap-2">
                <Database className="h-4 w-4" />
                Data
              </TabsTrigger>
            </TabsList>

            {/* Account Settings */}
            <TabsContent value="account" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Profile Information
                    </CardTitle>
                    <CardDescription>
                      Update your personal information and contact details
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
                      Security Settings
                    </CardTitle>
                    <CardDescription>
                      Manage your account security and authentication
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Two-Factor Authentication</Label>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <Switch
                        checked={settings.twoFactorEnabled}
                        onCheckedChange={(checked) => handleInputChange('twoFactorEnabled', checked)}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive important updates via email
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
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* System Settings */}
            <TabsContent value="system" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Attendance Configuration
                    </CardTitle>
                    <CardDescription>
                      Configure system-wide attendance policies and settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="minAttendance">Minimum Attendance Percentage</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="minAttendance"
                          type="number"
                          min="0"
                          max="100"
                          value={settings.minimumAttendancePercentage}
                          onChange={(e) => handleInputChange('minimumAttendancePercentage', parseInt(e.target.value))}
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="markingWindow">Attendance Marking Window</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="markingWindow"
                          type="number"
                          min="1"
                          max="60"
                          value={settings.attendanceMarkingWindow}
                          onChange={(e) => handleInputChange('attendanceMarkingWindow', parseInt(e.target.value))}
                        />
                        <span className="text-sm text-muted-foreground">minutes</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Notification Preferences
                    </CardTitle>
                    <CardDescription>
                      Configure when and how you receive notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Approval Request Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when teachers request approval
                        </p>
                      </div>
                      <Switch
                        checked={settings.approvalRequestNotifications}
                        onCheckedChange={(checked) => handleInputChange('approvalRequestNotifications', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>System Maintenance Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive updates about system maintenance
                        </p>
                      </div>
                      <Switch
                        checked={settings.systemMaintenanceNotifications}
                        onCheckedChange={(checked) => handleInputChange('systemMaintenanceNotifications', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Weekly Reports</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive weekly attendance summary reports
                        </p>
                      </div>
                      <Switch
                        checked={settings.weeklyReportsEnabled}
                        onCheckedChange={(checked) => handleInputChange('weeklyReportsEnabled', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* User Management */}
            <TabsContent value="users" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      User Management
                    </CardTitle>
                    <CardDescription>
                      Configure user approval and management settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto-Approval for Teachers</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically approve teacher registrations
                        </p>
                      </div>
                      <Switch
                        checked={settings.autoApprovalEnabled}
                        onCheckedChange={(checked) => handleInputChange('autoApprovalEnabled', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Bulk Import/Export</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable bulk user import and export features
                        </p>
                      </div>
                      <Switch
                        checked={settings.bulkImportEnabled}
                        onCheckedChange={(checked) => handleInputChange('bulkImportEnabled', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>
                      Perform common user management tasks
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Download className="h-4 w-4" />
                      Export User Data
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Upload className="h-4 w-4" />
                      Import Users (CSV)
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Plus className="h-4 w-4" />
                      Add New Department
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Data Settings */}
            <TabsContent value="data" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Data Management
                    </CardTitle>
                    <CardDescription>
                      Configure data retention and backup settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="retention">Data Retention Period</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="retention"
                          type="number"
                          min="1"
                          max="120"
                          value={settings.dataRetentionPeriod}
                          onChange={(e) => handleInputChange('dataRetentionPeriod', parseInt(e.target.value))}
                        />
                        <span className="text-sm text-muted-foreground">months</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto Backup</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically backup data daily
                        </p>
                      </div>
                      <Switch
                        checked={settings.autoBackupEnabled}
                        onCheckedChange={(checked) => handleInputChange('autoBackupEnabled', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Analytics Collection</Label>
                        <p className="text-sm text-muted-foreground">
                          Collect usage analytics for insights
                        </p>
                      </div>
                      <Switch
                        checked={settings.analyticsEnabled}
                        onCheckedChange={(checked) => handleInputChange('analyticsEnabled', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Data Actions</CardTitle>
                    <CardDescription>
                      Perform data management operations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Download className="h-4 w-4" />
                      Export All Data
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Download className="h-4 w-4" />
                      Generate Backup
                    </Button>
                    <Separator />
                    <Button variant="destructive" className="w-full justify-start gap-2">
                      <Trash2 className="h-4 w-4" />
                      Clear Old Data
                    </Button>
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
