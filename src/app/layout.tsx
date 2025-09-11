import type { Metadata } from 'next';
import { PT_Sans } from 'next/font/google'; // Changed from Inter to PT_Sans
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

// Setup PT Sans font
const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'QAttend',
  description: 'QR Code Attendance App',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${ptSans.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
