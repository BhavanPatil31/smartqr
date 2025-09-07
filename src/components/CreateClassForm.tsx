
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
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
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { Calendar, Clock, MapPin, Plus, Users } from 'lucide-react';
import { cn } from '@/lib/utils';


const DEPARTMENTS = ["Computer Science", "Electronics", "Mechanical", "Civil", "Biotechnology"];
const SEMESTERS = ["1st Semester", "2nd Semester", "3rd Semester", "4th Semester", "5th Semester", "6th Semester", "7th Semester", "8th Semester"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const classSchema = z.object({
  subject: z.string().min(3, "Subject name must be at least 3 characters."),
  roomNumber: z.string().min(1, "Room number is required."),
  department: z.string().min(1, "Please select a department."),
  semester: z.string().min(1, "Please select a semester."),
  days: z.array(z.string()).min(1, "Please select at least one class day."),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)."),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)."),
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
        roomNumber: '',
        department: '',
        semester: '',
        days: [],
        startTime: '',
        endTime: '',
        maxStudents: '' as any, // Initialize to prevent uncontrolled -> controlled error
    }
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

      // Create a separate class document for each selected day
      const creationPromises = values.days.map(day => {
        return addDoc(collection(db, 'classes'), {
            subject: values.subject,
            roomNumber: values.roomNumber,
            department: values.department,
            semester: values.semester,
            teacherId: user.uid,
            teacherName: teacherProfile.fullName,
            maxStudents: values.maxStudents || null,
            timeSlot: {
            day: day, // The schema expects a single day
            start: values.startTime,
            end: values.endTime,
            },
            createdAt: serverTimestamp(),
        });
      });
      
      await Promise.all(creationPromises);

      toast({ title: 'Success', description: `${values.days.length} class(es) created successfully!` });
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
                        <CardDescription>Fill in the information to create a new class schedule</CardDescription>
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
                                name="roomNumber"
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
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <FormField
                                control={form.control}
                                name="startTime"
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
                                name="endTime"
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
                         <FormField
                            control={form.control}
                            name="days"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Class Days *</FormLabel>
                                <FormControl>
                                     <ToggleGroup 
                                        type="multiple" 
                                        variant="outline"
                                        className="justify-start flex-wrap gap-2"
                                        value={field.value}
                                        onValueChange={field.onChange}
                                     >
                                        {DAYS.map(day => (
                                            <ToggleGroupItem key={day} value={day} aria-label={`Toggle ${day}`} className="w-24">
                                                {day}
                                            </ToggleGroupItem>
                                        ))}
                                    </ToggleGroup>
                                </FormControl>
                                <FormDescription>Select the days when this class occurs</FormDescription>
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
                         <Button type="submit" size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={isSaving}>
                           <Plus className="mr-2 h-4 w-4"/>
                           {isSaving ? 'Creating...' : 'Create Class'}
                        </Button>
                    </CardContent>
                </Card>
            </form>
        </Form>
         <Alert>
            <Calendar className="h-4 w-4" />
            <AlertTitle>Class Scheduling Tips</AlertTitle>
            <AlertDescription>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li>A separate class will be created for each day you select.</li>
                    <li>QR codes are generated for each class instance automatically.</li>
                    <li>Students can only mark attendance during the scheduled time window.</li>
                </ul>
            </AlertDescription>
        </Alert>
    </div>
  );
}
