
import { EditClassForm } from '@/components/EditClassForm';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditClassPage({ params }: { params: { id: string } }) {
  const classId = params.id;
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
       <Header />
        <main className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
             <div className="mb-6">
                <Button asChild variant="ghost" className="-ml-4">
                    <Link href="/teacher/dashboard">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back
                    </Link>
                </Button>
                 <h1 className="text-2xl font-bold mt-2">Edit Class</h1>
             </div>
            <EditClassForm classId={classId} />
        </main>
    </div>
  );
}
