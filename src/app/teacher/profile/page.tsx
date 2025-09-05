
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
import { ChevronLeft, Edit, Mail, Phone, User as UserIcon, Building } from 'lucide-react';
import Link from 'next/link';
import type { TeacherProfile } from '@/lib/data';

const DEPARTMENTS = ["Computer Science", "Electronics", "Mechanical", "Civil", "Biotechnology"];

export default function TeacherProfilePage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const { toast } = useToast();

  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/teacher/login');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const docRef = doc(db, 'teachers', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as TeacherProfile);
        } else {
          // Create a default profile if one doesn't exist
          const defaultProfile: TeacherProfile = {
            fullName: user.displayName || 'New Teacher',
            email: user.email || '',
            phoneNumber: '',
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
      await setDoc(doc(db, 'teachers', user.uid), profile);
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
        <div className="min-h-screen bg-muted/40 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <Skeleton className="h-12 w-48" />
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-80 w-full rounded-lg" />
                <Skeleton className="h-48 w-full rounded-lg" />
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-background border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
                <Button asChild variant="ghost" size="sm">
                    <Link href="/teacher/dashboard"><ChevronLeft className="mr-2 h-4 w-4"/>Back</Link>
                </Button>
                <h1 className="text-xl font-bold">Profile</h1>
                <Button variant={isEditMode ? "default" : "outline"} size="sm" onClick={() => {
                    if (isEditMode) {
                        handleSave();
                    } else {
                        setIsEditMode(true);
                    }
                }} disabled={isSaving}>
                   <Edit className="mr-2 h-4 w-4"/> {isEditMode ? (isSaving ? 'Saving...' : 'Save') : 'Edit'}
                </Button>
            </div>
        </div>
      </header>
      
      <main className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl space-y-6">
        <Card>
          <CardContent className="pt-6 flex flex-col items-center space-y-2">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="text-3xl">
                {profile.fullName?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="font-bold text-2xl">{profile.fullName}</p>
            <p className="text-muted-foreground">{profile.department}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className='flex items-center gap-2'>
              <UserIcon className="h-6 w-6" />
              <div>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>View and edit your profile information.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="fullName" value={profile.fullName} onChange={handleInputChange} disabled={!isEditMode} className="pl-8" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                 <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" value={profile.email} disabled />
                 </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="phoneNumber" type="tel" value={profile.phoneNumber} onChange={handleInputChange} disabled={!isEditMode} className="pl-8" />
                </div>
              </div>
               <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                 <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Select name="department" value={profile.department} onValueChange={(value) => handleSelectChange('department', value)} disabled={!isEditMode}>
                      <SelectTrigger className="pl-8"><SelectValue placeholder="Select Department" /></SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                 </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="link" className="p-0 text-foreground">Change Password</Button>
            <div className="flex justify-between items-center">
                <p>Email Verification Status</p>
                <span className={`text-sm ${user?.emailVerified ? 'text-green-600' : 'text-orange-500'}`}>
                    {user?.emailVerified ? 'Verified' : 'Not Verified'}
                </span>
            </div>
            <Button variant="link" className="p-0 text-destructive" onClick={handleLogout}>Sign Out</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
