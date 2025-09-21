"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QrCode, RefreshCw, Clock, AlertTriangle, CheckCircle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import type { Class } from '@/lib/data';
import { 
  generateQRCodeForClass, 
  isQRCodeValid, 
  getQRCodeTimeRemaining, 
  formatTimeRemaining 
} from '@/lib/data';

interface QRCodeManagerProps {
  classItem: Class;
  onClassUpdate: (updatedClass: Class) => void;
}

export function QRCodeManager({ classItem, onClassUpdate }: QRCodeManagerProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setQrCodeUrl(`${window.location.origin}/student/class/${classItem.id}`);
    }
  }, [classItem.id]);

  // Timer to update remaining time
  useEffect(() => {
    if (!isQRCodeValid(classItem)) {
      setTimeRemaining(0);
      return;
    }

    const updateTimer = () => {
      const remaining = getQRCodeTimeRemaining(classItem);
      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [classItem]);

  const handleGenerateQR = async () => {
    setIsGenerating(true);
    try {
      const { qrCode, expiresAt } = await generateQRCodeForClass(classItem.id);
      
      // Update the class item with new QR code data
      const updatedClass = {
        ...classItem,
        qrCode,
        qrCodeGeneratedAt: Date.now(),
        qrCodeExpiresAt: expiresAt
      };
      
      onClassUpdate(updatedClass);
      
      toast({
        title: 'QR Code Generated',
        description: 'New QR code generated successfully! It will expire in 10 minutes.',
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate QR code. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyQRUrl = async () => {
    if (!classItem.qrCode) return;
    
    const fullUrl = `${qrCodeUrl}?qr=${classItem.qrCode}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast({
        title: 'Copied!',
        description: 'QR code URL copied to clipboard.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy URL to clipboard.',
        variant: 'destructive',
      });
    }
  };

  const isValid = isQRCodeValid(classItem);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            <CardTitle>QR Code Management</CardTitle>
          </div>
          {isValid && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Clock className="h-3 w-3 mr-1" />
              {formatTimeRemaining(timeRemaining)}
            </Badge>
          )}
        </div>
        <CardDescription>
          Generate and manage QR codes for student attendance. QR codes expire after 10 minutes for security.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* QR Code Status */}
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            {isValid ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            )}
            <div>
              <p className="font-medium">
                {isValid ? 'QR Code Active' : 'QR Code Expired'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isValid 
                  ? `Expires in ${formatTimeRemaining(timeRemaining)}`
                  : 'Generate a new QR code to allow student attendance'
                }
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleGenerateQR}
            disabled={isGenerating}
            variant={isValid ? "outline" : "default"}
            size="sm"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : isValid ? 'Regenerate' : 'Generate QR'}
          </Button>
        </div>

        {/* QR Code Display */}
        {isValid && qrCodeUrl && classItem.qrCode && (
          <div className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-white rounded-lg border shadow-sm">
                <Image 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${qrCodeUrl}?qr=${classItem.qrCode}`)}`}
                  width={200}
                  height={200}
                  alt="Class QR Code"
                  className="rounded"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleCopyQRUrl}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy QR URL
                </Button>
              </div>
            </div>
            
            <Alert className="border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-blue-800">
                <strong>Security Notice:</strong> QR codes automatically expire after 10 minutes to prevent unauthorized access. 
                Students can only scan active QR codes during scheduled class hours.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Expired State */}
        {!isValid && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              The QR code for this class has expired or hasn't been generated yet. 
              Generate a new QR code to allow students to mark their attendance.
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <div className="space-y-2 text-sm text-muted-foreground">
          <h4 className="font-medium text-foreground">How to use:</h4>
          <ul className="space-y-1 ml-4">
            <li>• Generate a QR code when class begins</li>
            <li>• Students scan the QR code to mark attendance</li>
            <li>• QR codes expire after 10 minutes for security</li>
            <li>• Regenerate as needed during class sessions</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
