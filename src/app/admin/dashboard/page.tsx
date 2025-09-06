
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Header } from '@/components/Header';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { User, LogOut, BookOpen, Users, GraduationCap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getClassesByDepartment, getTeachersByDepartment, getStudentsByDepartment } from '@/lib/data';

import type { AdminProfile, Class, TeacherProfile, StudentProfile } from '@/lib/data';

export default function AdminDashboard() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/admin/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchProfileAndData = async () => {
      if (!user) {
         setIsLoadingData(false);
         return;
      };

      setIsLoadingData(true);
      try {
        const docRef = doc(db, 'admins', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const adminProfile = docSnap.data() as AdminProfile;
          setProfile(adminProfile);
          
          if (adminProfile.department) {
            const [deptClasses, deptTeachers, deptStudents] = await Promise.all([
                getClassesByDepartment(adminProfile.department),
                getTeachersByDepartment(adminProfile.department),
                getStudentsByDepartment(adminProfile.department)
            ]);
            setClasses(deptClasses);
            setTeachers(deptTeachers);
            setStudents(deptStudents);
          } else {
            setClasses([]);
            setTeachers([]);
            setStudents([]);
          }
        } else {
            // No profile, maybe redirect or show error. For now, show empty.
            setProfile(null);
            setClasses([]);
            setTeachers([]);
            setStudents([]);
            // You might want to force the admin to a profile setup page if it doesn't exist
        }
      } catch (error) {
          console.error("Failed to fetch admin data:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    if (!loading && user) {
        fetchProfileAndData();
    }
  }, [user, loading]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
  };

  if (loading || isLoadingData) {
    return (
      <div className="flex min-h-screen w-full flex-col gradient-bg-dark">
        <Header>
          <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
          </div>
        </Header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <div className="flex items-center justify-between">
            <div className='space-y-2'>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-5 w-64" />
            </div>
          </div>
          <Skeleton className="h-10 w-full max-w-sm" />
          <Card>
            <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
            <CardContent><Skeleton className="h-48 w-full" /></CardContent>
          </Card>
        </main>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen w-full flex-col gradient-bg-dark">
      <Header>
         <div className="flex items-center gap-2">
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
         </div>
      </Header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-2xl">Welcome, {profile?.fullName.split(' ')[0] || 'Admin'}</h1>
            <p className="text-muted-foreground">{profile?.department} Department Overview</p>
          </div>
        </div>
        
        <Tabs defaultValue="classes" className="w-full">
            <TabsList>
                <TabsTrigger value="classes"><BookOpen className="mr-2"/>Classes</TabsTrigger>
                <TabsTrigger value="teachers"><Users className="mr-2"/>Teachers</TabsTrigger>
                <TabsTrigger value="students"><GraduationCap className="mr-2"/>Students</TabsTrigger>
            </TabsList>
            <TabsContent value="classes">
                <Card className="mt-4 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Department Classes</CardTitle>
                        <CardDescription>All classes scheduled for the {profile?.department} department.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Semester</TableHead>
                                    <TableHead>Teacher</TableHead>
                                    <TableHead>Schedule</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {classes.map(c => (
                                    <TableRow key={c.id}>
                                        <TableCell>{c.subject}</TableCell>
                                        <TableCell>{c.semester}</TableCell>
                                        <TableCell>{c.teacherName}</TableCell>
                                        <TableCell>{c.timeSlot.day}, {c.timeSlot.start} - {c.timeSlot.end}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                         </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="teachers">
                 <Card className="mt-4 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Department Faculty</CardTitle>
                        <CardDescription>All teachers in the {profile?.department} department.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Phone Number</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {teachers.map(t => (
                                    <TableRow key={t.email}>
                                        <TableCell>{t.fullName}</TableCell>
                                        <TableCell>{t.email}</TableCell>
                                        <TableCell>{t.phoneNumber}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                         </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="students">
                 <Card className="mt-4 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Department Students</CardTitle>
                        <CardDescription>All students enrolled in the {profile?.department} department.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>USN</TableHead>
                                    <TableHead>Semester</TableHead>
                                    <TableHead>Email</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.map(s => (
                                    <TableRow key={s.email}>
                                        <TableCell>{s.fullName}</TableCell>
                                        <TableCell>{s.usn}</TableCell>
                                        <TableCell>{s.semester}</TableCell>
                                        <TableCell>{s.email}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                         </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>

      </main>
    </div>
  );
}
