"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';

export function AdminNotifications() {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    
    // Set up a real-time listener for pending teacher approvals
    const teachersQuery = query(
      collection(db, 'teachers'),
      where('isApproved', '==', false)
    );
    
    const unsubscribe = onSnapshot(teachersQuery, (snapshot) => {
      setPendingCount(snapshot.size);
      setLoading(false);
    }, (error) => {
      console.error("Error getting pending teachers:", error);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const handleViewApprovals = () => {
    router.push('/admin/dashboard');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {pendingCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {pendingCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading ? (
          <DropdownMenuItem disabled>Loading notifications...</DropdownMenuItem>
        ) : pendingCount > 0 ? (
          <DropdownMenuItem onClick={handleViewApprovals}>
            {pendingCount} teacher{pendingCount !== 1 ? 's' : ''} pending approval
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem disabled>No new notifications</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}