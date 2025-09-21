"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Header } from '@/components/Header';
import { ClassCard } from '@/components/ClassCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BookOpen, 
  Users, 
  Search, 
  Filter,
  GraduationCap,
  Clock,
  BarChart3,
  ChevronLeft,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import type { Class, AdminProfile } from '@/lib/data';

const SEMESTERS = ["1st Semester", "2nd Semester", "3rd Semester", "4th Semester", "5th Semester", "6th Semester", "7th Semester", "8th Semester"];

export default function AdminClassesPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [teachers, setTeachers] = useState<string[]>([]);

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

  // Fetch classes in admin's department
  useEffect(() => {
    if (user && adminProfile?.department) {
      setIsLoadingClasses(true);
      const q = query(
        collection(db, 'classes'), 
        where('department', '==', adminProfile.department)
      );
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const classesData = querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Class));
        
        setClasses(classesData);
        
        // Extract unique teachers
        const uniqueTeachers = [...new Set(classesData.map(c => c.teacherName))];
        setTeachers(uniqueTeachers);
        
        setIsLoadingClasses(false);
      }, (error) => {
        console.error("Error fetching classes:", error);
        setIsLoadingClasses(false);
      });
      
      return () => unsubscribe();
    } else if (!loading) {
      setIsLoadingClasses(false);
    }
  }, [user, loading, adminProfile]);

  // Filter classes based on search and filters
  useEffect(() => {
    let filtered = classes;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(classItem =>
        classItem.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        classItem.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Semester filter
    if (selectedSemester !== 'all') {
      filtered = filtered.filter(classItem => classItem.semester === selectedSemester);
    }

    // Teacher filter
    if (selectedTeacher !== 'all') {
      filtered = filtered.filter(classItem => classItem.teacherName === selectedTeacher);
    }

    setFilteredClasses(filtered);
  }, [classes, searchTerm, selectedSemester, selectedTeacher]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
  };

  // Calculate statistics
  const stats = {
    totalClasses: classes.length,
    totalTeachers: teachers.length,
    semesterBreakdown: SEMESTERS.reduce((acc, semester) => {
      acc[semester] = classes.filter(c => c.semester === semester).length;
      return acc;
    }, {} as Record<string, number>)
  };

  if (loading || isLoadingClasses || !user || !adminProfile) {
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
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
            <h1 className="font-bold text-2xl">Department Classes</h1>
            <p className="text-muted-foreground">
              Manage all classes in {adminProfile.department} department
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClasses}</div>
              <p className="text-xs text-muted-foreground">
                Across all semesters
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Teachers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTeachers}</div>
              <p className="text-xs text-muted-foreground">
                Teaching in department
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Most Active</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.keys(stats.semesterBreakdown).reduce((a, b) => 
                  stats.semesterBreakdown[a] > stats.semesterBreakdown[b] ? a : b
                ).replace(' Semester', '')}
              </div>
              <p className="text-xs text-muted-foreground">
                Semester with most classes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Department</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{adminProfile.department}</div>
              <p className="text-xs text-muted-foreground">
                Your department
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
              Filter and search through department classes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by subject or teacher name..."
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

              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="All Teachers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teachers</SelectItem>
                  {teachers.map(teacher => (
                    <SelectItem key={teacher} value={teacher}>
                      {teacher}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Classes Grid */}
        {filteredClasses.length > 0 ? (
          <div className="grid gap-6 pt-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredClasses.map((classItem) => (
              <ClassCard key={classItem.id} classItem={classItem} userRole="admin" />
            ))}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm mt-12 bg-card min-h-[400px]">
            <div className="flex flex-col items-center gap-2 text-center p-8">
              <BookOpen className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-2xl font-bold tracking-tight">
                {classes.length === 0 ? 'No classes found' : 'No matching classes'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {classes.length === 0 
                  ? `No classes have been created in ${adminProfile.department} department yet.`
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
              {searchTerm || selectedSemester !== 'all' || selectedTeacher !== 'all' ? (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedSemester('all');
                    setSelectedTeacher('all');
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
        {filteredClasses.length > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>
              Showing {filteredClasses.length} of {classes.length} classes
            </p>
            {(searchTerm || selectedSemester !== 'all' || selectedTeacher !== 'all') && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSemester('all');
                  setSelectedTeacher('all');
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
