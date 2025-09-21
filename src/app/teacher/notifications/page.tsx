"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import { Header } from '@/components/Header';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  ChevronLeft,
  Activity,
  RefreshCw,
  MessageSquare,
  Users,
  CheckCircle,
  Clock,
  Send
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import type { TeacherProfile } from '@/lib/data';

interface TeacherNotification {
  id: string;
  type: 'system' | 'message_sent' | 'approval' | 'student_update';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  relatedClassId?: string;
  relatedClassName?: string;
}

export default function TeacherNotificationsPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [notifications, setNotifications] = useState<TeacherNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    if (!loading && !user) {
      router.push('/teacher/login');
    }
  }, [user, loading, router]);

  // Fetch teacher profile
  useEffect(() => {
    if (!user) return;

    const teacherDocRef = doc(db, 'teachers', user.uid);
    const unsubscribe = onSnapshot(teacherDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const profile = docSnap.data() as TeacherProfile;
        setTeacherProfile(profile);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch notifications
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        // For now, create sample notifications since we don't have a teacher notifications system yet
        const sampleNotifications: TeacherNotification[] = [
          {
            id: '1',
            type: 'system',
            title: 'Welcome to SmartQR',
            message: 'Your teacher account has been approved. You can now create classes and manage attendance.',
            timestamp: Date.now() - 24 * 60 * 60 * 1000,
            read: true,
            priority: 'medium'
          },
          {
            id: '2',
            type: 'message_sent',
            title: 'Message Sent Successfully',
            message: 'Your message "Class starting soon" was sent to 25 students in Data Structures class.',
            timestamp: Date.now() - 2 * 60 * 60 * 1000,
            read: false,
            priority: 'low',
            relatedClassId: 'class1',
            relatedClassName: 'Data Structures'
          },
          {
            id: '3',
            type: 'student_update',
            title: 'New Student Enrolled',
            message: 'John Doe has enrolled in your Machine Learning class.',
            timestamp: Date.now() - 6 * 60 * 60 * 1000,
            read: false,
            priority: 'medium',
            relatedClassId: 'class2',
            relatedClassName: 'Machine Learning'
          },
          {
            id: '4',
            type: 'system',
            title: 'QR Code Security Update',
            message: 'QR codes now expire after 10 minutes for enhanced security.',
            timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
            read: true,
            priority: 'medium'
          }
        ];

        setNotifications(sampleNotifications);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();

    // Set up real-time listener for teacher notifications (when implemented)
    // For now, just use a simple interval to simulate updates
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
  };

  const handleRefresh = () => {
    setLastUpdated(new Date());
  };

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
  };

  const getNotificationIcon = (type: TeacherNotification['type']) => {
    switch (type) {
      case 'message_sent': return Send;
      case 'student_update': return Users;
      case 'approval': return CheckCircle;
      case 'system': return Bell;
      default: return Bell;
    }
  };

  const getNotificationColor = (priority: TeacherNotification['priority']) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-blue-500';
      default: return 'border-l-gray-500';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading || isLoading || !teacherProfile) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <Header>
          <Skeleton className="h-9 w-24" />
        </Header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header 
        onLogout={handleLogout} 
        user={user}
        userType="teacher"
        userProfile={teacherProfile}
      />
      <main className="flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <Button asChild variant="ghost" className="-ml-4 mb-2">
              <Link href="/teacher/dashboard">
                <ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard
              </Link>
            </Button>
            <h1 className="font-bold text-2xl">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with system notifications and message history
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4 animate-pulse text-green-600" />
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
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
              <p className="text-xs text-muted-foreground">All notifications</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{unreadCount}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {notifications.filter(n => n.type === 'message_sent').length}
              </div>
              <p className="text-xs text-muted-foreground">To students</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
            <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

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
                            } hover:shadow-md transition-shadow cursor-pointer`}
                            onClick={() => handleMarkAsRead(notification.id)}
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
                                  {notification.relatedClassName && (
                                    <span className="flex items-center gap-1">
                                      <MessageSquare className="h-3 w-3" />
                                      {notification.relatedClassName}
                                    </span>
                                  )}
                                </div>
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
                            className={`p-4 border-l-4 rounded-lg bg-blue-50 ${getNotificationColor(notification.priority)} hover:shadow-md transition-shadow cursor-pointer`}
                            onClick={() => handleMarkAsRead(notification.id)}
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
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {notification.message}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(notification.timestamp), 'MMM dd, yyyy HH:mm')}
                                  </span>
                                </div>
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
                      You have no unread notifications.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Message History</CardTitle>
                <CardDescription>
                  Messages you've sent to students
                </CardDescription>
              </CardHeader>
              <CardContent>
                {notifications.filter(n => n.type === 'message_sent').length > 0 ? (
                  <div className="space-y-4">
                    {notifications
                      .filter(n => n.type === 'message_sent')
                      .sort((a, b) => b.timestamp - a.timestamp)
                      .map((notification) => (
                        <div key={notification.id} className="p-4 border rounded-lg">
                          <div className="flex items-start gap-4">
                            <Send className="h-5 w-5 mt-1 text-blue-600" />
                            <div className="flex-1">
                              <h3 className="font-semibold mb-1">{notification.title}</h3>
                              <p className="text-sm text-muted-foreground mb-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>{format(new Date(notification.timestamp), 'MMM dd, yyyy HH:mm')}</span>
                                {notification.relatedClassName && (
                                  <span>Class: {notification.relatedClassName}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Messages Sent</h3>
                    <p className="text-muted-foreground">
                      Messages you send to students will appear here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
