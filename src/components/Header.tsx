import { QrCode } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

export function Header({ children }: { children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <QrCode className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">QAttend</span>
        </Link>
        <div className="flex flex-1 items-center justify-end">
          {children}
        </div>
      </div>
    </header>
  );
}
