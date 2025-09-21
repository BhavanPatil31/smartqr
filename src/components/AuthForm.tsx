
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QrCode } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';

interface AuthFormProps {
  userType: 'student' | 'teacher' | 'admin';
}

export function AuthForm({ userType }: AuthFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleAuthAction = async (action: 'login' | 'register') => {
    setIsLoading(true);
    
    if (action === 'register') {
      if (password !== confirmPassword) {
        toast({
          title: 'Error',
          description: 'Passwords do not match.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      try {
        // Create the user account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // For teacher accounts, create a profile with approval status
        if (userType === 'teacher') {
          await setDoc(doc(db, 'teachers', userCredential.user.uid), {
            email: email,
            fullName: '',
            phoneNumber: '',
            department: '',
            isApproved: false,
            isApprovalRequested: false,
            registeredAt: Date.now()
          });
          
          toast({
            title: 'Account Created',
            description: 'Please complete your profile and submit for approval.',
          });
          router.push(`/${userType}/profile`);
        } else {
          // For non-teacher accounts, proceed as normal
          toast({
            title: 'Success',
            description: 'Account created! Redirecting to dashboard...',
          });
          router.push(`/${userType}/dashboard`);
        }
      } catch (error: any) {
        toast({
          title: 'Registration Failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    } else { // Login
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // For teacher accounts, check approval status
        if (userType === 'teacher') {
          const teacherDoc = await getDoc(doc(db, 'teachers', userCredential.user.uid));
          
          if (teacherDoc.exists()) {
            const teacherData = teacherDoc.data();
            const requested = Boolean((teacherData as any).isApprovalRequested);
            if (teacherData.isApproved === false && requested) {
              toast({
                title: 'Account Pending Approval',
                description: 'Your account is still pending admin approval.',
                variant: 'default',
              });
              router.push(`/${userType}/pending-approval`);
              setIsLoading(false);
              return;
            } else if (teacherData.isApproved === false && !requested) {
              // Not requested yet; send to profile to complete and request approval
              router.push(`/${userType}/profile`);
              setIsLoading(false);
              return;
            }
          }
        }
        
        toast({
          title: 'Login Successful!',
          description: 'Redirecting to your dashboard...',
        });
        router.push(`/${userType}/dashboard`);
      } catch (error: any) {
        toast({
          title: 'Login Failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    }
    
    setIsLoading(false);
  };
  
  const FormSkeleton = () => (
     <Card className="w-full max-w-sm bg-card/80 backdrop-blur-sm">
        <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full" />
            </div>
             <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
        </CardContent>
     </Card>
  );

  const titleCase = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="absolute top-6 left-6">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <QrCode className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">SmartQR</span>
        </Link>
      </div>
      
      {!isClient ? <FormSkeleton /> : (
        <Tabs defaultValue="login" className="w-full max-w-sm">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{titleCase(userType)} Login</CardTitle>
                <CardDescription>Enter your email and password to access your dashboard.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); handleAuthAction('login'); }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-login">Email</Label>
                    <Input id="email-login" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-login">Password</Label>
                    <Input id="password-login" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">{titleCase(userType)} Registration</CardTitle>
                  <CardDescription>Create an account to get started.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => { e.preventDefault(); handleAuthAction('register'); }} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email-register">Email</Label>
                      <Input id="email-register" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password-register">Password</Label>
                      <Input id="password-register" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input id="confirm-password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
        </Tabs>
      )}
    </main>
  );
}
