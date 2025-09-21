import { QrCode, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AdminNotifications } from '@/components/AdminNotifications';
import { NavigationMenu } from '@/components/NavigationMenu';

interface HeaderProps {
  children?: ReactNode;
  user?: any;
  onLogout?: () => void;
  userType?: 'admin' | 'teacher' | 'student';
  userProfile?: any;
}

export function Header({ 
  user, 
  onLogout, 
  children, 
  isAdmin = false, 
  userType,
  userProfile 
}: HeaderProps & { isAdmin?: boolean }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-auto flex items-center space-x-2">
          {/* Navigation Menu - Always visible */}
          {userType && onLogout && (
            <NavigationMenu
              userType={userType}
              userName={user?.displayName || userProfile?.fullName || 'User'}
              userEmail={user?.email || ''}
              onLogout={onLogout}
              userProfile={userProfile}
            />
          )}
          
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <QrCode className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">SmartQR</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          {/* Only show admin notifications if admin */}
          {isAdmin && (
            <AdminNotifications />
          )}
        </div>
      </div>
    </header>
  );
}
