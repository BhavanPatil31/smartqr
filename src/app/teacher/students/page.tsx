"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, collectionGroup, getDocs } from 'firebase/firestore';
import { Header } from '@/components/Header';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Activity,
  RefreshCw,
  Award,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import type { TeacherProfile, StudentProfile, AttendanceRecord, Class } from '@/lib/data';
import { calculateStudentAttendanceStats } from '@/lib/data';

interface StudentWithStats {
  id: string;
  fullName: string;
  usn: string;
  email: string;
  phoneNumber: string;
  department: string;
  semester: string;
  attendanceRate?: number;
  totalClasses?: number;
  attendedClasses?: number;
  lastAttendance?: Date;
  classesWithTeacher?: string[];
}

export default function TeacherStudentsPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [students, setStudents] = useState<StudentWithStats[]>([]);
  const [teacherClasses, setTeacherClasses] = useState<Class[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

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

  // Fetch teacher's classes and students
  useEffect(() => {
    if (!user || !teacherProfile) return;

    const fetchStudentsData = async () => {
      setIsLoading(true);
      try {
        // Get teacher's classes
        const classesQuery = query(
          collection(db, 'classes'),
          where('teacherId', '==', user.uid)
        );
        const classesSnapshot = await getDocs(classesQuery);
        const classes = classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));
        setTeacherClasses(classes);

        if (classes.length === 0) {
          setStudents([]);
          setIsLoading(false);
          return;
        }

        // Get unique departments and semesters from teacher's classes
        const departmentSemesters = new Set(classes.map(c => `${c.department}-${c.semester}`));
        
        // Fetch students from all relevant department-semester combinations
        const studentPromises = Array.from(departmentSemesters).map(async (deptSem) => {
          const [department, semester] = deptSem.split('-');
          const studentsQuery = query(
            collection(db, 'students'),
            where('department', '==', department),
            where('semester', '==', semester)
          );
          const studentsSnapshot = await getDocs(studentsQuery);
          return studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as StudentProfile & { id: string }));
        });

        const allStudentArrays = await Promise.all(studentPromises);
        const allStudents = allStudentArrays.flat();
        
        // Remove duplicates based on student ID
        const uniqueStudents = allStudents.filter((student, index, self) => 
          index === self.findIndex(s => (s as any).id === (student as any).id)
        );

        // Calculate attendance stats for each student
        const studentsWithStats = await Promise.all(
          uniqueStudents.map(async (student) => {
            try {
              const stats = await calculateStudentAttendanceStats((student as any).id);
              
              // Get student's classes with this teacher
              const studentClasses = classes.filter(c => 
                c.department === student.department && c.semester === student.semester
              );
              
              // Get last attendance for this student in teacher's classes
              let attendanceRecords: AttendanceRecord[] = [];
              try {
                const attendanceQuery = query(
                  collectionGroup(db, 'records'),
                  where('studentId', '==', (student as any).id)
                );
                const attendanceSnapshot = await getDocs(attendanceQuery);
                attendanceRecords = attendanceSnapshot.docs.map(doc => doc.data() as AttendanceRecord);
              } catch (attendanceError) {
                console.log('Could not fetch attendance records for student:', (student as any).id);
                // Continue with empty records
              }
              
              // Filter records for teacher's classes only
              const teacherClassIds = studentClasses.map(c => c.id);
              const relevantRecords = attendanceRecords.filter(record => 
                teacherClassIds.includes(record.classId)
              );
              
              const lastAttendance = relevantRecords.length > 0 
                ? new Date(Math.max(...relevantRecords.map(r => new Date(r.timestamp).getTime())))
                : undefined;

              return {
                ...student,
                attendanceRate: stats.attendanceRate,
                totalClasses: stats.totalClasses,
                attendedClasses: stats.attendedClasses,
                lastAttendance,
                classesWithTeacher: studentClasses.map(c => c.subject)
              } as StudentWithStats;
            } catch (error) {
              console.error(`Error calculating stats for student ${(student as any).id}:`, error);
              return {
                ...student,
                attendanceRate: 0,
                totalClasses: 0,
                attendedClasses: 0,
                classesWithTeacher: []
              } as StudentWithStats;
            }
          })
        );

        setStudents(studentsWithStats);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error fetching students data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentsData();

    // Set up real-time listener for teacher's classes changes instead of all attendance records
    const classesQuery = query(
      collection(db, 'classes'),
      where('teacherId', '==', user.uid)
    );
    
    const unsubscribe = onSnapshot(classesQuery, () => {
      console.log('Teacher classes updated - refreshing student stats');
      fetchStudentsData();
    }, (error) => {
      console.error('Error in classes listener:', error);
    });

    return () => unsubscribe();
  }, [user, teacherProfile]);

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

    // Class filter
    if (selectedClass !== 'all') {
      filtered = filtered.filter(student => 
        student.classesWithTeacher?.includes(selectedClass)
      );
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
  }, [students, searchTerm, selectedClass, selectedStatus]);

  const handleRefresh = async () => {
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

  const getAttendanceStatus = (rate: number) => {
    if (rate >= 90) return { label: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100', icon: Award };
    if (rate >= 75) return { label: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: CheckCircle };
    if (rate >= 60) return { label: 'Warning', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: AlertTriangle };
    return { label: 'Critical', color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertTriangle };
  };

  // Calculate statistics
  const stats = {
    totalStudents: students.length,
    averageAttendance: students.length > 0 
      ? students.reduce((sum, s) => sum + (s.attendanceRate || 0), 0) / students.length 
      : 0,
    excellentStudents: students.filter(s => (s.attendanceRate || 0) >= 90).length,
    needAttention: students.filter(s => (s.attendanceRate || 0) < 75).length,
    totalClasses: teacherClasses.length
  };

  if (loading || isLoading || !teacherProfile) {
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
            <h1 className="font-bold text-2xl">My Students</h1>
            <p className="text-muted-foreground">
              Students in your classes with live attendance tracking
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
                Across {stats.totalClasses} classes
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
                Class average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Excellent (90%+)</CardTitle>
              <Award className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.excellentStudents}</div>
              <p className="text-xs text-muted-foreground">
                High performers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Need Attention</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.needAttention}</div>
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
              Filter and search through your students
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
              
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {teacherClasses.map(classItem => (
                    <SelectItem key={classItem.id} value={classItem.subject}>
                      {classItem.subject}
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
              const status = getAttendanceStatus(student.attendanceRate || 0);
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
                            <Badge variant="outline" className={`${status.bgColor} ${status.color}`}>
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

                          {/* Classes with teacher */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            {student.classesWithTeacher?.map((subject, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {subject}
                              </Badge>
                            ))}
                          </div>

                          {/* Last attendance */}
                          {student.lastAttendance && (
                            <div className="text-xs text-muted-foreground">
                              Last attendance: {format(student.lastAttendance, 'MMM dd, yyyy HH:mm')}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {(student.attendanceRate || 0).toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {student.attendedClasses || 0}/{student.totalClasses || 0} classes
                        </div>
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
                  ? 'No students are enrolled in your classes yet.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
              {searchTerm || selectedClass !== 'all' || selectedStatus !== 'all' ? (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedClass('all');
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
            {(searchTerm || selectedClass !== 'all' || selectedStatus !== 'all') && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedClass('all');
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
