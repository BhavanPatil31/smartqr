
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
import { ChevronLeft, Edit, Mail, Phone, User as UserIcon, Building, LogOut } from 'lucide-react';
import Link from 'next/link';
import type { TeacherProfile } from '@/lib/data';
import { Header } from '@/components/Header';

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
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
       <Header>
        <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
                <Link href="/teacher/dashboard"><ChevronLeft className="mr-2 h-4 w-4"/>Back to Dashboard</Link>
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
              <p className="text-muted-foreground">{profile.department || 'No department selected'}</p>
               <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>View and edit your profile information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" value={profile.fullName} onChange={handleInputChange} disabled={!isEditMode} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={profile.email} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input id="phoneNumber" type="tel" value={profile.phoneNumber} onChange={handleInputChange} disabled={!isEditMode} />
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
