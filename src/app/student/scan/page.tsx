
"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft, ScanLine } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import jsQR from 'jsqr';

export default function ScanPage() {
  const router = useRouter();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to scan QR codes.',
        });
      }
    };

    getCameraPermission();

     return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast]);

  useEffect(() => {
    let animationFrameId: number;

    const tick = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
            });

            if (code) {
                setScanResult(code.data);
            }
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    if (hasCameraPermission) {
        animationFrameId = requestAnimationFrame(tick);
    }
    
    return () => {
        cancelAnimationFrame(animationFrameId);
    };

  }, [hasCameraPermission]);


  useEffect(() => {
    if (scanResult) {
      try {
        const url = new URL(scanResult);
        const path = url.pathname;
        if (path.startsWith('/student/class/')) {
            toast({
                title: 'QR Code Scanned!',
                description: 'Redirecting to your class...',
            });
            router.push(path);
        } else {
             toast({
                variant: 'destructive',
                title: 'Invalid QR Code',
                description: 'Please scan a valid class QR code.',
            });
            setScanResult(null); // Reset to allow re-scanning
        }
      } catch (error) {
         toast({
            variant: 'destructive',
            title: 'Invalid QR Code',
            description: 'The scanned code is not a valid URL.',
        });
        setScanResult(null); // Reset to allow re-scanning
      }
    }
  }, [scanResult, router, toast]);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/student/dashboard"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
          </Button>

          <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-muted">
            <video ref={videoRef} className="h-full w-full object-cover" autoPlay playsInline muted />
             <canvas ref={canvasRef} className="hidden" />

            {hasCameraPermission === false && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Alert variant="destructive" className="w-4/5">
                        <AlertTitle>Camera Access Required</AlertTitle>
                        <AlertDescription>
                            Please allow camera access to scan QR codes.
                        </AlertDescription>
                    </Alert>
                </div>
            )}

            {hasCameraPermission && !scanResult && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2/3 h-2/3 border-4 border-dashed border-primary/50 rounded-lg animate-pulse" />
                     <div className="absolute top-0 h-1 w-full bg-primary/80 animate-[scan_2s_ease-in-out_infinite]" />
                </div>
            )}
          </div>
           <p className="mt-4 text-center text-muted-foreground flex items-center justify-center gap-2">
             <ScanLine className="h-5 w-5"/>
            <span>Point your camera at the class QR code.</span>
          </p>
        </div>
      </main>
    </div>
  );
}
