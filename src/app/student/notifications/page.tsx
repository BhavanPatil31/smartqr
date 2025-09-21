"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot, collection, query, where, orderBy, limit, addDoc, serverTimestamp, updateDoc, getDocs } from 'firebase/firestore';
import { Header } from '@/components/Header';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  BellOff,
  ChevronLeft,
  Settings,
  Activity,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info,
  Calendar,
  Clock,
  BookOpen,
  Users,
  Trash2,
  Mail
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import type { StudentProfile } from '@/lib/data';

interface Notification {
  id: string;
  type: 'class_reminder' | 'attendance_warning' | 'system_update' | 'assignment' | 'general';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  classId?: string;
  className?: string;
  actionUrl?: string;
}

interface NotificationSettings {
  classReminders: boolean;
  attendanceWarnings: boolean;
  systemUpdates: boolean;
  assignments: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export default function StudentNotificationsPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    classReminders: true,
    attendanceWarnings: true,
    systemUpdates: true,
    assignments: true,
    emailNotifications: false,
    pushNotifications: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/student/login');
    }
  }, [user, loading, router]);

  // Fetch student profile
  useEffect(() => {
    if (!user) return;

    const studentDocRef = doc(db, 'students', user.uid);
    const unsubscribe = onSnapshot(studentDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const profile = docSnap.data() as StudentProfile;
        setStudentProfile(profile);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch notifications and settings
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        // Fetch real notifications from Firestore
        const notificationsQuery = query(
          collection(db, 'notifications'),
          where('studentId', '==', user.uid),
          orderBy('timestamp', 'desc'),
          limit(50)
        );
        
        let realNotifications: Notification[] = [];
        
        try {
          const notificationsSnapshot = await getDocs(notificationsQuery);
          realNotifications = notificationsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toMillis() || Date.now()
          } as Notification));
        } catch (queryError) {
          console.log('No notifications found or permission issue:', queryError);
          // Continue with empty array
        }

        // Add some sample notifications if no real ones exist
        const sampleNotifications: Notification[] = realNotifications.length === 0 ? [
          {
            id: '1',
            type: 'class_reminder',
            title: 'Class Starting Soon',
            message: 'Data Structures class starts in 15 minutes in Room 101',
            timestamp: Date.now() - 15 * 60 * 1000,
            read: false,
            priority: 'high',
            classId: 'class1',
            className: 'Data Structures'
          },
          {
            id: '2',
            type: 'attendance_warning',
            title: 'Attendance Warning',
            message: 'Your attendance in Database Management is below 75%. Current: 68%',
            timestamp: Date.now() - 2 * 60 * 60 * 1000,
            read: false,
            priority: 'high'
          },
          {
            id: '3',
            type: 'system_update',
            title: 'New QR Code Feature',
            message: 'QR codes now expire after 10 minutes for better security',
            timestamp: Date.now() - 24 * 60 * 60 * 1000,
            read: true,
            priority: 'medium'
          },
          {
            id: '4',
            type: 'assignment',
            title: 'Assignment Due Soon',
            message: 'Machine Learning assignment due tomorrow at 11:59 PM',
            timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
            read: true,
            priority: 'medium'
          },
          {
            id: '5',
            type: 'general',
            title: 'Welcome to SmartQR',
            message: 'Welcome to the new attendance system. Scan QR codes to mark your attendance.',
            timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
            read: true,
            priority: 'low'
          }
        ] : [];

        setNotifications([...realNotifications, ...sampleNotifications]);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();

    // Set up real-time listener for new notifications
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('studentId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      notificationsQuery, 
      (snapshot) => {
        const updatedNotifications: Notification[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toMillis() || Date.now()
        } as Notification));

        setNotifications(updatedNotifications);
        setLastUpdated(new Date());
      },
      (error) => {
        console.log('Real-time listener error:', error);
        // Keep existing notifications on error
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
      // Real-time listener will update the UI
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAsUnread = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: false
      });
      // Real-time listener will update the UI
    } catch (error) {
      console.error('Error marking notification as unread:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        deleted: true
      });
      // Real-time listener will update the UI
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  const handleSettingChange = (setting: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
    // In real app, save to Firestore
    console.log(`Setting ${setting} changed to ${value}`);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }, 1000);
  };

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'class_reminder': return BookOpen;
      case 'attendance_warning': return AlertTriangle;
      case 'system_update': return Settings;
      case 'assignment': return Calendar;
      case 'general': return Info;
      default: return Bell;
    }
  };

  const getNotificationColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-blue-500';
      default: return 'border-l-gray-500';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading || isLoading || !studentProfile) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <Header>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </Header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
          <Card>
            <CardHeader><Skeleton className="h-7 w-64" /></CardHeader>
            <CardContent>
               <div className="space-y-4">
                   {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
               </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header 
        onLogout={handleLogout} 
        user={user}
        userType="student"
        userProfile={studentProfile}
      />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <Button asChild variant="ghost" className="-ml-4 mb-2">
              <Link href="/student/dashboard">
                <ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard
              </Link>
            </Button>
            <h1 className="font-bold text-2xl">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with real-time notifications
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4 animate-pulse text-green-600" />
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notifications.length}</div>
              <p className="text-xs text-muted-foreground">
                All notifications
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread</CardTitle>
              <BellOff className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{unreadCount}</div>
              <p className="text-xs text-muted-foreground">
                Need attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {notifications.filter(n => n.priority === 'high').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Important alerts
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
              <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark All as Read
              </Button>
            )}
          </div>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Notifications</CardTitle>
                <CardDescription>
                  Your complete notification history
                </CardDescription>
              </CardHeader>
              <CardContent>
                {notifications.length > 0 ? (
                  <div className="space-y-4">
                    {notifications
                      .sort((a, b) => b.timestamp - a.timestamp)
                      .map((notification) => {
                        const Icon = getNotificationIcon(notification.type);
                        return (
                          <div 
                            key={notification.id} 
                            className={`p-4 border-l-4 rounded-lg ${getNotificationColor(notification.priority)} ${
                              !notification.read ? 'bg-blue-50' : 'bg-white'
                            } hover:shadow-md transition-shadow`}
                          >
                            <div className="flex items-start gap-4">
                              <Icon className={`h-5 w-5 mt-1 ${
                                notification.priority === 'high' ? 'text-red-600' :
                                notification.priority === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                              }`} />
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold">{notification.title}</h3>
                                  {!notification.read && (
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                      New
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className={
                                    notification.priority === 'high' ? 'border-red-200 text-red-700' :
                                    notification.priority === 'medium' ? 'border-yellow-200 text-yellow-700' :
                                    'border-blue-200 text-blue-700'
                                  }>
                                    {notification.priority}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {notification.message}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(notification.timestamp), 'MMM dd, yyyy HH:mm')}
                                  </span>
                                  {notification.className && (
                                    <span className="flex items-center gap-1">
                                      <BookOpen className="h-3 w-3" />
                                      {notification.className}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {!notification.read ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMarkAsRead(notification.id)}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMarkAsUnread(notification.id)}
                                  >
                                    <Mail className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteNotification(notification.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
                    <p className="text-muted-foreground">
                      You're all caught up! New notifications will appear here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="unread" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Unread Notifications</CardTitle>
                <CardDescription>
                  Notifications that need your attention ({unreadCount})
                </CardDescription>
              </CardHeader>
              <CardContent>
                {notifications.filter(n => !n.read).length > 0 ? (
                  <div className="space-y-4">
                    {notifications
                      .filter(n => !n.read)
                      .sort((a, b) => b.timestamp - a.timestamp)
                      .map((notification) => {
                        const Icon = getNotificationIcon(notification.type);
                        return (
                          <div 
                            key={notification.id} 
                            className={`p-4 border-l-4 rounded-lg bg-blue-50 ${getNotificationColor(notification.priority)} hover:shadow-md transition-shadow`}
                          >
                            <div className="flex items-start gap-4">
                              <Icon className={`h-5 w-5 mt-1 ${
                                notification.priority === 'high' ? 'text-red-600' :
                                notification.priority === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                              }`} />
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold">{notification.title}</h3>
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                    New
                                  </Badge>
                                  <Badge variant="outline" className={
                                    notification.priority === 'high' ? 'border-red-200 text-red-700' :
                                    notification.priority === 'medium' ? 'border-yellow-200 text-yellow-700' :
                                    'border-blue-200 text-blue-700'
                                  }>
                                    {notification.priority}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {notification.message}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(notification.timestamp), 'MMM dd, yyyy HH:mm')}
                                  </span>
                                  {notification.className && (
                                    <span className="flex items-center gap-1">
                                      <BookOpen className="h-3 w-3" />
                                      {notification.className}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMarkAsRead(notification.id)}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteNotification(notification.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                    <p className="text-muted-foreground">
                      You have no unread notifications. Great job staying on top of things!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Customize which notifications you receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="font-medium">Class Reminders</label>
                      <p className="text-sm text-muted-foreground">
                        Get notified before your classes start
                      </p>
                    </div>
                    <Switch
                      checked={settings.classReminders}
                      onCheckedChange={(checked) => handleSettingChange('classReminders', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="font-medium">Attendance Warnings</label>
                      <p className="text-sm text-muted-foreground">
                        Alerts when your attendance drops below 75%
                      </p>
                    </div>
                    <Switch
                      checked={settings.attendanceWarnings}
                      onCheckedChange={(checked) => handleSettingChange('attendanceWarnings', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="font-medium">System Updates</label>
                      <p className="text-sm text-muted-foreground">
                        Important system announcements and updates
                      </p>
                    </div>
                    <Switch
                      checked={settings.systemUpdates}
                      onCheckedChange={(checked) => handleSettingChange('systemUpdates', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="font-medium">Assignment Notifications</label>
                      <p className="text-sm text-muted-foreground">
                        Reminders about upcoming assignments and deadlines
                      </p>
                    </div>
                    <Switch
                      checked={settings.assignments}
                      onCheckedChange={(checked) => handleSettingChange('assignments', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="font-medium">Email Notifications</label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="font-medium">Push Notifications</label>
                      <p className="text-sm text-muted-foreground">
                        Browser push notifications for real-time alerts
                      </p>
                    </div>
                    <Switch
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
