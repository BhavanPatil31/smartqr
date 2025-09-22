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
  BookOpen,
  ChevronLeft,
  UserCheck,
  UserX,
  Clock,
  Award,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import type { TeacherProfile, AdminProfile, Class } from '@/lib/data';

interface TeacherWithSubjects extends TeacherProfile {
  id: string;
  subjects: string[];
  totalClasses: number;
  approvalStatus: 'approved' | 'pending' | 'rejected';
}

export default function AdminTeachersPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [teachers, setTeachers] = useState<TeacherWithSubjects[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<TeacherWithSubjects[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(true);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

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

  // Fetch teachers and their subjects
  useEffect(() => {
    if (user && adminProfile?.department) {
      setIsLoadingTeachers(true);
      
      // Fetch teachers in admin's department
      const teachersQuery = query(
        collection(db, 'teachers'), 
        where('department', '==', adminProfile.department)
      );
      
      const unsubscribeTeachers = onSnapshot(teachersQuery, async (teachersSnapshot) => {
        const teachersData = teachersSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as TeacherProfile & { id: string }));
        
        // Fetch classes for each teacher to get their subjects
        const classesQuery = query(
          collection(db, 'classes'),
          where('department', '==', adminProfile.department)
        );
        
        const unsubscribeClasses = onSnapshot(classesQuery, (classesSnapshot) => {
          const classesData = classesSnapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
          } as Class));
          
          // Group classes by teacher and extract subjects
          const teacherSubjects: Record<string, { subjects: Set<string>; totalClasses: number }> = {};
          
          classesData.forEach(classItem => {
            if (!teacherSubjects[classItem.teacherId]) {
              teacherSubjects[classItem.teacherId] = {
                subjects: new Set(),
                totalClasses: 0
              };
            }
            teacherSubjects[classItem.teacherId].subjects.add(classItem.subject);
            teacherSubjects[classItem.teacherId].totalClasses++;
          });
          
          // Combine teacher data with their subjects
          const teachersWithSubjects: TeacherWithSubjects[] = teachersData.map(teacher => ({
            ...teacher,
            subjects: Array.from(teacherSubjects[teacher.id]?.subjects || []),
            totalClasses: teacherSubjects[teacher.id]?.totalClasses || 0,
            approvalStatus: teacher.isApproved === true ? 'approved' : 
                           teacher.isApproved === false ? 'rejected' : 'pending'
          }));
          
          setTeachers(teachersWithSubjects);
          setIsLoadingTeachers(false);
        });
        
        return () => unsubscribeClasses();
      }, (error) => {
        console.error("Error fetching teachers:", error);
        setIsLoadingTeachers(false);
      });
      
      return () => unsubscribeTeachers();
    } else if (!loading) {
      setIsLoadingTeachers(false);
    }
  }, [user, loading, adminProfile]);

  // Filter teachers based on search and filters
  useEffect(() => {
    let filtered = teachers;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(teacher =>
        teacher.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.subjects.some(subject => 
          subject.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(teacher => teacher.approvalStatus === selectedStatus);
    }

    setFilteredTeachers(filtered);
  }, [teachers, searchTerm, selectedStatus]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
  };

  // Calculate statistics
  const stats = {
    totalTeachers: teachers.length,
    approvedTeachers: teachers.filter(t => t.approvalStatus === 'approved').length,
    pendingTeachers: teachers.filter(t => t.approvalStatus === 'pending').length,
    rejectedTeachers: teachers.filter(t => t.approvalStatus === 'rejected').length,
    totalSubjects: new Set(teachers.flatMap(t => t.subjects)).size,
    averageClassesPerTeacher: teachers.length > 0 
      ? teachers.reduce((sum, t) => sum + t.totalClasses, 0) / teachers.length 
      : 0
  };

  const getStatusBadge = (status: 'approved' | 'pending' | 'rejected') => {
    switch (status) {
      case 'approved':
        return { 
          label: 'Approved', 
          color: 'bg-green-100 text-green-800', 
          icon: CheckCircle 
        };
      case 'pending':
        return { 
          label: 'Pending', 
          color: 'bg-yellow-100 text-yellow-800', 
          icon: Clock 
        };
      case 'rejected':
        return { 
          label: 'Rejected', 
          color: 'bg-red-100 text-red-800', 
          icon: XCircle 
        };
    }
  };

  if (loading || isLoadingTeachers || !user || !adminProfile) {
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
            <h1 className="font-bold text-2xl">Department Teachers</h1>
            <p className="text-muted-foreground">
              Manage teachers in {adminProfile.department} department
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTeachers}</div>
              <p className="text-xs text-muted-foreground">
                In department
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approvedTeachers}</div>
              <p className="text-xs text-muted-foreground">
                Active teachers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingTeachers}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSubjects}</div>
              <p className="text-xs text-muted-foreground">
                Unique subjects taught
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
              Filter and search through department teachers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or subject..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Teachers List */}
        {filteredTeachers.length > 0 ? (
          <div className="space-y-4">
            {filteredTeachers.map((teacher) => {
              const statusInfo = getStatusBadge(teacher.approvalStatus);
              const StatusIcon = statusInfo.icon;
              
              return (
                <Card key={teacher.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {teacher.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{teacher.fullName}</h3>
                            <Badge variant="outline" className={statusInfo.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusInfo.label}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              {teacher.email}
                            </span>
                            {teacher.phoneNumber && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                {teacher.phoneNumber}
                              </span>
                            )}
                          </div>

                          {/* Subjects taught */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            {teacher.subjects.length > 0 ? (
                              teacher.subjects.map((subject, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {subject}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">No subjects assigned</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {teacher.totalClasses}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {teacher.totalClasses === 1 ? 'class' : 'classes'}
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
                {teachers.length === 0 ? 'No teachers found' : 'No matching teachers'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {teachers.length === 0 
                  ? `No teachers are registered in ${adminProfile.department} department yet.`
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
              {searchTerm || selectedStatus !== 'all' ? (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
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
        {filteredTeachers.length > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>
              Showing {filteredTeachers.length} of {teachers.length} teachers
            </p>
            {(searchTerm || selectedStatus !== 'all') && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setSearchTerm('');
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
