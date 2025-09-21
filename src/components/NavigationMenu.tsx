"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Menu,
  Settings,
  User,
  LogOut,
  Home,
  BookOpen,
  Users,
  GraduationCap,
  CheckSquare,
  BarChart3,
  Calendar,
  Bell,
  Shield,
  FileText,
  HelpCircle,
  Info
} from 'lucide-react';

interface NavigationMenuProps {
  userType: 'admin' | 'teacher' | 'student';
  userName?: string;
  userEmail?: string;
  onLogout: () => void;
  userProfile?: any;
}

export function NavigationMenu({ 
  userType, 
  userName = 'User', 
  userEmail = '', 
  onLogout,
  userProfile 
}: NavigationMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getMenuItems = () => {
    switch (userType) {
      case 'admin':
        return [
          {
            icon: Home,
            label: 'Dashboard',
            href: '/admin/dashboard',
            description: 'Overview and main features'
          },
          {
            icon: Users,
            label: 'Teacher Approvals',
            href: '/admin/approvals',
            description: 'Manage teacher registrations'
          },
          {
            icon: BookOpen,
            label: 'Classes',
            href: '/admin/classes',
            description: 'View all department classes'
          },
          {
            icon: GraduationCap,
            label: 'Students',
            href: '/admin/students',
            description: 'Manage department students'
          },
          {
            icon: Users,
            label: 'Teachers',
            href: '/admin/teachers',
            description: 'Manage department teachers'
          },
          {
            icon: BarChart3,
            label: 'Analytics',
            href: '/admin/analytics',
            description: 'System reports and insights'
          },
          {
            icon: Settings,
            label: 'Settings',
            href: '/admin/settings',
            description: 'Account and system preferences'
          }
        ];

      case 'teacher':
        return [
          {
            icon: Home,
            label: 'Dashboard',
            href: '/teacher/dashboard',
            description: 'Overview of your classes'
          },
          {
            icon: BookOpen,
            label: 'My Classes',
            href: '/teacher/classes',
            description: 'Manage your classes'
          },
          {
            icon: CheckSquare,
            label: 'Create Class',
            href: '/teacher/create-class',
            description: 'Create a new class'
          },
          {
            icon: GraduationCap,
            label: 'Students',
            href: '/teacher/students',
            description: 'View student information'
          },
          {
            icon: BarChart3,
            label: 'Reports',
            href: '/teacher/reports',
            description: 'Attendance reports'
          },
          {
            icon: Bell,
            label: 'Notifications',
            href: '/teacher/notifications',
            description: 'View notifications'
          },
          {
            icon: Settings,
            label: 'Settings',
            href: '/teacher/settings',
            description: 'Account and preferences'
          }
        ];

      case 'student':
        return [
          {
            icon: Home,
            label: 'Dashboard',
            href: '/student/dashboard',
            description: 'Your attendance overview'
          },
          {
            icon: CheckSquare,
            label: 'Mark Attendance',
            href: '/student/attendance',
            description: 'Scan QR for live classes only'
          },
          {
            icon: BookOpen,
            label: 'My Classes',
            href: '/student/classes',
            description: 'View classes you have attended'
          },
          {
            icon: BarChart3,
            label: 'Attendance Reports',
            href: '/student/reports',
            description: 'View attendance statistics'
          },
          {
            icon: FileText,
            label: 'History',
            href: '/student/history',
            description: 'Attendance history'
          },
          {
            icon: Bell,
            label: 'Notifications',
            href: '/student/notifications',
            description: 'View notifications'
          },
          {
            icon: Settings,
            label: 'Settings',
            href: '/student/settings',
            description: 'Account and preferences'
          }
        ];

      default:
        return [
          {
            icon: Home,
            label: 'Dashboard',
            href: `/${userType}/dashboard`,
            description: 'Overview and main features'
          },
          {
            icon: Settings,
            label: 'Settings',
            href: `/${userType}/settings`,
            description: 'Account and preferences'
          }
        ];
    }
  };

  const menuItems = getMenuItems();

  const isActive = (href: string) => {
    return pathname === href;
  };

  const getUserTypeLabel = () => {
    switch (userType) {
      case 'admin': return 'Administrator';
      case 'teacher': return 'Teacher';
      case 'student': return 'Student';
      default: return 'User';
    }
  };

  const getUserTypeBadgeColor = () => {
    switch (userType) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'teacher': return 'bg-blue-100 text-blue-800';
      case 'student': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="p-6 bg-gradient-to-r from-slate-50 to-slate-100 border-b">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <SheetTitle className="text-lg font-semibold text-gray-900">
                  {userName}
                </SheetTitle>
                <p className="text-sm text-gray-600 truncate">{userEmail}</p>
                <Badge className={`mt-1 text-xs ${getUserTypeBadgeColor()}`}>
                  {getUserTypeLabel()}
                </Badge>
              </div>
            </div>
          </SheetHeader>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-1 px-3">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`
                      flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors
                      ${active 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${active ? 'text-primary-foreground' : 'text-gray-500'}`} />
                    <div className="flex-1">
                      <div className="font-medium">{item.label}</div>
                      <div className={`text-xs ${active ? 'text-primary-foreground/80' : 'text-gray-500'}`}>
                        {item.description}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </nav>

            <Separator className="my-4 mx-3" />

            {/* Additional Options */}
            <nav className="space-y-1 px-3">
              <div className="px-3 py-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Support
                </h3>
              </div>
              
              <Link
                href="/help"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <HelpCircle className="mr-3 h-4 w-4 text-gray-500" />
                Help & Support
              </Link>
              
              <Link
                href="/about"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <Info className="mr-3 h-4 w-4 text-gray-500" />
                About SmartQR
              </Link>
            </nav>
          </div>

          {/* Footer */}
          <div className="border-t p-4">
            <Button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Logout
            </Button>
            
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500">SmartQR v1.0.0</p>
              <p className="text-xs text-gray-400">© 2024 All rights reserved</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
