
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, Edit, LogOut } from 'lucide-react';
import Link from 'next/link';
import type { StudentProfile } from '@/lib/data';
import { Header } from '@/components/Header';

const DEPARTMENTS = ["Computer Science", "Electronics", "Mechanical", "Civil", "Biotechnology"];
const SEMESTERS = ["1st Semester", "2nd Semester", "3rd Semester", "4th Semester", "5th Semester", "6th Semester", "7th Semester", "8th Semester"];


export default function StudentProfilePage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const { toast } = useToast();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/student/login');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const docRef = doc(db, 'students', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as StudentProfile);
        } else {
          // Create a default profile if one doesn't exist
          const defaultProfile: StudentProfile = {
            fullName: user.displayName || 'New User',
            usn: '',
            email: user.email || '',
            phoneNumber: '',
            semester: '',
            department: '',
          };
          setProfile(defaultProfile);
          setIsEditMode(true); // Force edit mode for new profiles
        }
      }
    };
    fetchProfile();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setProfile(prev => prev ? { ...prev, [id]: value } : null);
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setProfile(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'students', user.uid), profile);
      toast({ title: 'Success', description: 'Profile updated successfully!' });
      setIsEditMode(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update profile.', variant: 'destructive' });
      console.error("Error updating profile: ", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
  };
  
  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-muted/40">
        <Header>
            <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-44" />
                <Skeleton className="h-9 w-24" />
            </div>
        </Header>
        <main className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl space-y-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-10 w-32" />
            </div>
            <Card>
                <CardContent className="pt-6 flex flex-col md:flex-row items-center gap-6">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <div className="space-y-2 text-center md:text-left">
                        <Skeleton className="h-8 w-40" />
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-56" />
                    <Skeleton className="h-4 w-full max-w-md" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </main>
    </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <Header>
        <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
                <Link href="/student/dashboard"><ChevronLeft className="mr-2 h-4 w-4"/>Back to Dashboard</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4"/> Logout
            </Button>
        </div>
      </Header>
      
      <main className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Your Profile</h1>
             <Button variant={isEditMode ? "default" : "outline"} onClick={() => {
                if (isEditMode) {
                    handleSave();
                } else {
                    setIsEditMode(true);
                }
            }} disabled={isSaving}>
                <Edit className="mr-2 h-4 w-4"/> {isEditMode ? (isSaving ? 'Saving...' : 'Save Changes') : 'Edit Profile'}
            </Button>
        </div>

        <Card>
          <CardContent className="pt-6 flex flex-col md:flex-row items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="text-3xl">
                {profile.fullName?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left">
                <p className="font-bold text-2xl">{profile.fullName}</p>
                <p className="text-muted-foreground">{profile.usn || 'No USN provided'}</p>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Academic Information</CardTitle>
            <CardDescription>View and edit your personal and academic details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                 <Input id="fullName" value={profile.fullName} onChange={handleInputChange} disabled={!isEditMode} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="usn">USN</Label>
                <Input id="usn" value={profile.usn} onChange={handleInputChange} disabled={!isEditMode} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input id="phoneNumber" type="tel" value={profile.phoneNumber} onChange={handleInputChange} disabled={!isEditMode} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={profile.email} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                 <Select name="semester" value={profile.semester} onValueChange={(value) => handleSelectChange('semester', value)} disabled={!isEditMode}>
                    <SelectTrigger><SelectValue placeholder="Select Semester" /></SelectTrigger>
                    <SelectContent>
                      {SEMESTERS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                  <Select name="department" value={profile.department} onValueChange={(value) => handleSelectChange('department', value)} disabled={!isEditMode}>
                    <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
