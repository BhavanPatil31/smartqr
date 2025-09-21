"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, User } from 'lucide-react';
import { toast } from 'sonner';
import type { TeacherProfile } from '@/lib/data';

interface TeacherWithId extends TeacherProfile {
  id: string;
}

export function TeacherApprovalList({ adminId, adminDept }: { adminId: string; adminDept?: string }) {
  const [pendingTeachers, setPendingTeachers] = useState<TeacherWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<string[]>([]);

  useEffect(() => {
    setLoading(true);
    const constraints = [where('isApproved', '==', false), where('isApprovalRequested', '==', true)] as any[];
    if (adminDept) constraints.push(where('department', '==', adminDept));
    const teachersQuery = query(collection(db, 'teachers'), ...constraints);
    const unsub = onSnapshot(teachersQuery, (qs) => {
      const teachers: TeacherWithId[] = qs.docs.map(d => ({ id: d.id, ...d.data() as TeacherProfile }));
      setPendingTeachers(teachers);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching pending teachers:', error);
      toast.error('Failed to load pending teacher approvals');
      setLoading(false);
    });
    return () => unsub();
  }, [adminDept]);

  const handleApprove = async (teacherId: string) => {
    setProcessingIds((prev) => [...prev, teacherId]);
    try {
      const teacherRef = doc(db, 'teachers', teacherId);
      await updateDoc(teacherRef, {
        isApproved: true,
        approvedBy: adminId,
        approvedAt: Date.now()
      });
      
      toast.success('Teacher account approved successfully');
      // Remove the approved teacher from the list
      setPendingTeachers((prev) => prev.filter(teacher => teacher.id !== teacherId));
    } catch (error) {
      console.error('Error approving teacher:', error);
      toast.error('Failed to approve teacher account');
    } finally {
      setProcessingIds((prev) => prev.filter(id => id !== teacherId));
    }
  };

  const handleReject = async (teacherId: string) => {
    // In a real application, you might want to implement a rejection flow
    // For now, we'll just show a toast message
    toast.info('Rejection functionality not implemented yet');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Teacher Approval Requests</h2>
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-9 w-20 mr-2" />
              <Skeleton className="h-9 w-20" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (pendingTeachers.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Teacher Approval Requests</h2>
        </div>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No pending teacher approvals</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Teacher Approval Requests</h2>
        <Badge variant="secondary">{pendingTeachers.length} Pending</Badge>
      </div>
      
      {pendingTeachers.map((teacher) => (
        <Card key={teacher.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{teacher.fullName}</CardTitle>
              <Badge variant="outline" className="text-xs">
                {new Date(teacher.registeredAt || 0).toLocaleDateString()}
              </Badge>
            </div>
            <CardDescription>{teacher.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Department:</span>{' '}
                {teacher.department || 'Not specified'}
              </div>
              <div>
                <span className="text-muted-foreground">Phone:</span>{' '}
                {teacher.phoneNumber || 'Not provided'}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleReject(teacher.id)}
              disabled={processingIds.includes(teacher.id)}
            >
              <XCircle className="mr-1 h-4 w-4" />
              Reject
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={() => handleApprove(teacher.id)}
              disabled={processingIds.includes(teacher.id)}
            >
              <CheckCircle className="mr-1 h-4 w-4" />
              Approve
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}