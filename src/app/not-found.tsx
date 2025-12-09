import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background gradient-bg p-4 text-center">
            <div className="space-y-6 max-w-md animate-fade-in-up">
                <div className="flex justify-center">
                    <div className="p-6 bg-primary/10 rounded-full animate-pulse-slow">
                        <FileQuestion className="h-16 w-16 text-primary" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl gradient-text">
                        404
                    </h1>
                    <h2 className="text-2xl font-semibold">Page Not Found</h2>
                    <p className="text-muted-foreground">
                        Oops! The page you're looking for doesn't exist or has been moved.
                    </p>
                </div>

                <div className="pt-4">
                    <Button asChild size="lg" className="gap-2">
                        <Link href="/">
                            <Home className="h-4 w-4" />
                            Return Home
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
