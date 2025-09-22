"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Header } from '@/components/Header';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  Search, 
  Filter,
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  ChevronLeft,
  UserCheck,
  UserX,
  TrendingUp,
  Award
} from 'lucide-react';
import Link from 'next/link';
import type { StudentProfile, AdminProfile } from '@/lib/data';
import { calculateStudentAttendanceStats } from '@/lib/data';

const SEMESTERS = ["1st Semester", "2nd Semester", "3rd Semester", "4th Semester", "5th Semester", "6th Semester", "7th Semester", "8th Semester"];

interface StudentWithStats extends StudentProfile {
  id: string;
  attendanceRate?: number;
  totalClasses?: number;
  attendedClasses?: number;
}

export default function AdminStudentsPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [students, setStudents] = useState<StudentWithStats[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithStats[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Background function to load student stats without blocking UI
  const loadStudentStatsInBackground = async (studentsData: (StudentProfile & { id: string })[]) => {
    // Process students in batches to avoid overwhelming the system
    const BATCH_SIZE = 5;
    
    for (let i = 0; i < studentsData.length; i += BATCH_SIZE) {
      const batch = studentsData.slice(i, i + BATCH_SIZE);
      
      // Process batch in parallel
      const batchPromises = batch.map(async (student) => {
        try {
          const stats = await calculateStudentAttendanceStats(student.id);
          return {
            studentId: student.id,
            stats: {
              attendanceRate: stats.attendanceRate,
              totalClasses: stats.totalClasses,
              attendedClasses: stats.attendedClasses
            }
          };
        } catch (error) {
          console.error(`Error calculating stats for student ${student.id}:`, error);
          return {
            studentId: student.id,
            stats: {
              attendanceRate: 0,
              totalClasses: 0,
              attendedClasses: 0
            }
          };
        }
      });
      
      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises);
      
      // Update students state with the new stats
      setStudents(prevStudents => 
        prevStudents.map(student => {
          const result = batchResults.find(r => r.studentId === student.id);
          if (result) {
            return {
              ...student,
              ...result.stats
            };
          }
          return student;
        })
      );
      
      // Small delay between batches to prevent overwhelming Firestore
      if (i + BATCH_SIZE < studentsData.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/admin/login');
    }
  }, [user, loading, router]);

  // Fetch admin profile
  useEffect(() => {
    const fetchAdminProfile = async () => {
      if (user) {
        try {
          const adminDoc = await getDoc(doc(db, 'admins', user.uid));
          if (adminDoc.exists()) {
            const adminData = adminDoc.data() as AdminProfile;
            setAdminProfile(adminData);
          }
        } catch (error) {
          console.error("Error fetching admin profile:", error);
        }
      }
    };
    
    fetchAdminProfile();
  }, [user]);

  // Fetch students in admin's department
  useEffect(() => {
    if (user && adminProfile?.department) {
      setIsLoadingStudents(true);
      const q = query(
        collection(db, 'students'), 
        where('department', '==', adminProfile.department)
      );
      
      const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        const studentsData = querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as StudentProfile & { id: string }));
        
        // First, set students without stats for immediate display
        const studentsWithoutStats: StudentWithStats[] = studentsData.map(student => ({
          ...student,
          attendanceRate: undefined,
          totalClasses: undefined,
          attendedClasses: undefined
        }));
        
        setStudents(studentsWithoutStats);
        setIsLoadingStudents(false);
        
        // Then, load stats in the background (non-blocking)
        loadStudentStatsInBackground(studentsData);
      }, (error) => {
        console.error("Error fetching students:", error);
        setIsLoadingStudents(false);
      });
      
      return () => unsubscribe();
    } else if (!loading) {
      setIsLoadingStudents(false);
    }
  }, [user, loading, adminProfile]);

  // Filter students based on search and filters
  useEffect(() => {
    let filtered = students;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.usn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Semester filter
    if (selectedSemester !== 'all') {
      filtered = filtered.filter(student => student.semester === selectedSemester);
    }

    // Status filter (based on attendance rate)
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(student => {
        const rate = student.attendanceRate || 0;
        switch (selectedStatus) {
          case 'excellent': return rate >= 90;
          case 'good': return rate >= 75 && rate < 90;
          case 'warning': return rate >= 60 && rate < 75;
          case 'critical': return rate < 60;
          default: return true;
        }
      });
    }

    setFilteredStudents(filtered);
  }, [students, searchTerm, selectedSemester, selectedStatus]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
  };

  // Calculate statistics
  const studentsWithStats = students.filter(s => s.attendanceRate !== undefined);
  const stats = {
    totalStudents: students.length,
    semesterBreakdown: SEMESTERS.reduce((acc, semester) => {
      acc[semester] = students.filter(s => s.semester === semester).length;
      return acc;
    }, {} as Record<string, number>),
    attendanceBreakdown: {
      excellent: studentsWithStats.filter(s => s.attendanceRate! >= 90).length,
      good: studentsWithStats.filter(s => s.attendanceRate! >= 75 && s.attendanceRate! < 90).length,
      warning: studentsWithStats.filter(s => s.attendanceRate! >= 60 && s.attendanceRate! < 75).length,
      critical: studentsWithStats.filter(s => s.attendanceRate! < 60).length,
    },
    averageAttendance: studentsWithStats.length > 0 
      ? studentsWithStats.reduce((sum, s) => sum + s.attendanceRate!, 0) / studentsWithStats.length 
      : 0
  };

  const getAttendanceStatus = (rate: number) => {
    if (rate >= 90) return { label: 'Excellent', color: 'bg-green-100 text-green-800', icon: Award };
    if (rate >= 75) return { label: 'Good', color: 'bg-blue-100 text-blue-800', icon: UserCheck };
    if (rate >= 60) return { label: 'Warning', color: 'bg-yellow-100 text-yellow-800', icon: TrendingUp };
    return { label: 'Critical', color: 'bg-red-100 text-red-800', icon: UserX };
  };

  if (loading || isLoadingStudents || !user || !adminProfile) {
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
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
        userType="admin"
        userProfile={adminProfile}
      />
      <main className="flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <Button asChild variant="ghost" className="-ml-4 mb-2">
              <Link href="/admin/dashboard">
                <ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard
              </Link>
            </Button>
            <h1 className="font-bold text-2xl">Department Students</h1>
            <p className="text-muted-foreground">
              Manage students in {adminProfile.department} department
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                Across all semesters
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageAttendance.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Department average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Excellent (90%+)</CardTitle>
              <Award className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.attendanceBreakdown.excellent}</div>
              <p className="text-xs text-muted-foreground">
                High performers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Need Attention</CardTitle>
              <UserX className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.attendanceBreakdown.warning + stats.attendanceBreakdown.critical}
              </div>
              <p className="text-xs text-muted-foreground">
                Below 75% attendance
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
            <CardDescription>
              Filter and search through department students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, USN, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="All Semesters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {SEMESTERS.map(semester => (
                    <SelectItem key={semester} value={semester}>
                      {semester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="excellent">Excellent (90%+)</SelectItem>
                  <SelectItem value="good">Good (75-89%)</SelectItem>
                  <SelectItem value="warning">Warning (60-74%)</SelectItem>
                  <SelectItem value="critical">Critical (&lt;60%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        {filteredStudents.length > 0 ? (
          <div className="space-y-4">
            {filteredStudents.map((student) => {
              const status = student.attendanceRate !== undefined 
                ? getAttendanceStatus(student.attendanceRate) 
                : { label: 'Loading', color: 'bg-gray-100 text-gray-800', icon: TrendingUp };
              const StatusIcon = status.icon;
              
              return (
                <Card key={student.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {student.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{student.fullName}</h3>
                            <Badge variant="outline" className={status.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <GraduationCap className="h-4 w-4" />
                              {student.usn}
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              {student.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {student.semester}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {student.attendanceRate !== undefined ? (
                          <>
                            <div className="text-2xl font-bold">
                              {student.attendanceRate.toFixed(1)}%
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {student.attendedClasses || 0}/{student.totalClasses || 0} classes
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-2xl font-bold text-muted-foreground">
                              Loading...
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Calculating stats
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm mt-12 bg-card min-h-[400px]">
            <div className="flex flex-col items-center gap-2 text-center p-8">
              <Users className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-2xl font-bold tracking-tight">
                {students.length === 0 ? 'No students found' : 'No matching students'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {students.length === 0 
                  ? `No students are registered in ${adminProfile.department} department yet.`
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
              {searchTerm || selectedSemester !== 'all' || selectedStatus !== 'all' ? (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedSemester('all');
                    setSelectedStatus('all');
                  }}
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              ) : null}
            </div>
          </div>
        )}

        {/* Results Summary */}
        {filteredStudents.length > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>
              Showing {filteredStudents.length} of {students.length} students
            </p>
            {(searchTerm || selectedSemester !== 'all' || selectedStatus !== 'all') && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSemester('all');
                  setSelectedStatus('all');
                }}
              >
                Clear all filters
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
