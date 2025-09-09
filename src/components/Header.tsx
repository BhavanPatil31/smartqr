import { QrCode } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ThemeToggle } from './ThemeToggle';

export function Header({ left, children, actions }: { left?: ReactNode, children?: ReactNode, actions?: ReactNode }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="flex items-center gap-4">
          {left}
          <Link href="/" className="mr-auto flex items-center space-x-2">
            <QrCode className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">QAttend</span>
          </Link>
        </div>
         <div className="flex items-center space-x-4">
          {children}
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          {actions}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
