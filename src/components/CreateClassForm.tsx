
"use client";

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { generateQRCodeForClass } from '@/lib/data';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { TeacherProfile } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Calendar, Clock, MapPin, Plus, Trash, Users } from 'lucide-react';
import { cn } from '@/lib/utils';


const DEPARTMENTS = ["Computer Science", "Electronics", "Mechanical", "Civil", "Biotechnology"];
const SEMESTERS = ["1st Semester", "2nd Semester", "3rd Semester", "4th Semester", "5th Semester", "6th Semester", "7th Semester", "8th Semester"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const scheduleSchema = z.object({
  day: z.string().min(1, "Please select a day."),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)."),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)."),
  roomNumber: z.string().min(1, "Room number is required."),
});

const classSchema = z.object({
  subject: z.string().min(3, "Subject name must be at least 3 characters."),
  department: z.string().min(1, "Please select a department."),
  semester: z.string().min(1, "Please select a semester."),
  schedules: z.array(scheduleSchema).min(1, "Please add at least one schedule."),
  maxStudents: z.coerce.number().int().positive("Must be a positive number.").optional(),
});

type ClassFormValues = z.infer<typeof classSchema>;


export function CreateClassForm() {
  const [user] = useAuthState(auth);
  const { toast } = useToast();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  
  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: {
        subject: '',
        department: '',
        semester: '',
        schedules: [{ day: '', startTime: '', endTime: '', roomNumber: '' }],
        maxStudents: '' as any, // Initialize to prevent uncontrolled -> controlled error
    }
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "schedules"
  });


  const handleCreateClass = async (values: ClassFormValues) => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to create a class.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const teacherDocRef = doc(db, 'teachers', user.uid);
      const teacherDocSnap = await getDoc(teacherDocRef);
      if (!teacherDocSnap.exists()) {
        throw new Error("Teacher profile not found.");
      }
      const teacherProfile = teacherDocSnap.data() as TeacherProfile;
      
      // Check if the teacher is approved
      if (teacherProfile.isApproved !== true) {
        toast({ title: 'Access Denied', description: 'Your account is pending approval. You cannot create classes until approved by an administrator.', variant: 'destructive' });
        router.push('/teacher/pending-approval');
        return;
      }

      // Create the class document first
      const classDocRef = await addDoc(collection(db, 'classes'), {
        subject: values.subject,
        department: values.department,
        semester: values.semester,
        teacherId: user.uid,
        teacherName: teacherProfile.fullName,
        maxStudents: values.maxStudents || null,
        schedules: values.schedules,
        createdAt: serverTimestamp(),
      });
      
      // Generate QR code for the newly created class
      try {
        const { qrCode, expiresAt } = await generateQRCodeForClass(classDocRef.id);
        toast({ 
          title: 'Success', 
          description: `Class "${values.subject}" created successfully with QR code! QR code expires in 10 minutes.` 
        });
      } catch (qrError) {
        console.error('Error generating QR code:', qrError);
        toast({ 
          title: 'Class Created', 
          description: `Class "${values.subject}" created successfully, but QR code generation failed. You can generate it later.`,
          variant: 'destructive'
        });
      }
      
      router.push('/teacher/dashboard');
      form.reset();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create class.', variant: 'destructive' });
      console.error('Error creating class:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateClass)} className="space-y-8">
                <Card>
                    <CardHeader>
                        <div className='flex items-center gap-2'>
                           <Plus className="h-5 w-5" />
                           <CardTitle>Class Details</CardTitle>
                        </div>
                        <CardDescription>Fill in the basic information for your class.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <FormField
                                control={form.control}
                                name="subject"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Subject Name *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Data Structures" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="semester"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Semester *</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Select semester" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {SEMESTERS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <FormField
                                control={form.control}
                                name="department"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Department *</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="maxStudents"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Maximum Students</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input type="number" placeholder="e.g., 50" className="pl-9" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>
                
                 <Card>
                    <CardHeader>
                        <div className='flex items-center justify-between'>
                            <div className='space-y-1.5'>
                                <CardTitle>Class Schedules</CardTitle>
                                <CardDescription>Add one or more weekly schedules for this class.</CardDescription>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={() => append({ day: '', startTime: '', endTime: '', roomNumber: '' })}>
                                <Plus className="mr-2 h-4 w-4" /> Add Schedule
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {fields.map((field, index) => (
                          <div key={field.id} className="p-4 border rounded-md space-y-4 relative bg-muted/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <FormField
                                control={form.control}
                                name={`schedules.${index}.day`}
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Day *</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Select day" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                               />
                               <FormField
                                control={form.control}
                                name={`schedules.${index}.roomNumber`}
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Room Number *</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="e.g., Room 101" className="pl-9" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                               />
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name={`schedules.${index}.startTime`}
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Start Time *</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input type="time" className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`schedules.${index}.endTime`}
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>End Time *</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input type="time" className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                             </div>
                              {fields.length > 1 && (
                                <Button type="button" variant="destructive" size="sm" className="absolute top-2 right-2" onClick={() => remove(index)}>
                                    <Trash className="h-4 w-4" />
                                </Button>
                            )}
                          </div>  
                        ))}
                    </CardContent>
                </Card>

                <Button type="submit" size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={isSaving}>
                   <Plus className="mr-2 h-4 w-4"/>
                   {isSaving ? 'Creating...' : 'Create Class'}
                </Button>
            </form>
        </Form>
         <Alert>
            <Calendar className="h-4 w-4" />
            <AlertTitle>Scheduling Information</AlertTitle>
            <AlertDescription>
                A single class can now have multiple schedules. This is useful for subjects that occur on different days or times throughout the week.
            </AlertDescription>
        </Alert>
    </div>
  );
}
