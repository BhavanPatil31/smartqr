import { QrCode } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

export function Header({ children }: { children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-auto flex items-center space-x-2">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <QrCode className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-green-400">QAttend</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            {children}
          </nav>
        </div>
      </div>
    </header>
  );
}
