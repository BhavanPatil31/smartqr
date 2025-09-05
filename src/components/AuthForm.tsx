"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QrCode } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface AuthFormProps {
  userType: 'student' | 'teacher';
}

export function AuthForm({ userType }: AuthFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
        await createUserWithEmailAndPassword(auth, email, password);
        toast({
          title: 'Success',
          description: 'Account created successfully! Please log in.',
        });
        router.push(`/${userType}/dashboard`);
      } catch (error: any) {
        toast({
          title: 'Registration Failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    } else { // Login
      try {
        await signInWithEmailAndPassword(auth, email, password);
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


  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="absolute top-4 left-4">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <QrCode className="h-6 w-6 text-primary" />
          <span className="font-bold font-headline">QAttend</span>
        </Link>
      </div>
      <Card className="w-full max-w-sm">
        <Tabs defaultValue="login">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <CardHeader>
              <CardTitle className="text-2xl">Student Login</CardTitle>
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
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </CardContent>
          </TabsContent>
          <TabsContent value="register">
            <CardHeader>
              <CardTitle className="text-2xl">Student Registration</CardTitle>
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
          </TabsContent>
        </Tabs>
      </Card>
    </main>
  );
}
