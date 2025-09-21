"use client";

import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  AlertTriangle, 
  Camera, 
  Smartphone, 
  Wifi, 
  RefreshCw, 
  Settings, 
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Shield,
  Globe
} from 'lucide-react';

interface MobileCameraTroubleshootingProps {
  error?: string;
  onRetry?: () => void;
  showRetryButton?: boolean;
}

export function MobileCameraTroubleshooting({ 
  error, 
  onRetry, 
  showRetryButton = true 
}: MobileCameraTroubleshootingProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const isHttps = typeof window !== 'undefined' && 
    (window.location.protocol === 'https:' || window.location.hostname === 'localhost');

  const troubleshootingSteps = [
    {
      icon: Shield,
      title: "Check Browser Permissions",
      description: "Allow camera access when prompted",
      details: [
        "Tap 'Allow' when the browser asks for camera permission",
        "If you accidentally blocked it, look for a camera icon in the address bar",
        "On Chrome: Tap the lock icon → Camera → Allow",
        "On Safari: Tap 'aA' → Website Settings → Camera → Allow"
      ]
    },
    {
      icon: RefreshCw,
      title: "Refresh the Page",
      description: "Reload after granting permissions",
      details: [
        "After allowing camera access, refresh the page",
        "Pull down on the page to refresh on mobile",
        "Or tap the refresh button in your browser"
      ]
    },
    {
      icon: Globe,
      title: "Use HTTPS Connection",
      description: "Camera requires secure connection",
      details: [
        "Make sure the URL starts with 'https://'",
        "Avoid using 'http://' links on mobile",
        "If you're on a local network, try accessing via IP address with HTTPS"
      ]
    },
    {
      icon: Smartphone,
      title: "Check Device Settings",
      description: "Ensure camera isn't blocked system-wide",
      details: [
        "Go to your phone's Settings → Privacy → Camera",
        "Make sure your browser (Chrome/Safari) has camera permission",
        "Close other apps that might be using the camera",
        "Restart your browser if needed"
      ]
    },
    {
      icon: Camera,
      title: "Try Different Browser",
      description: "Some browsers work better than others",
      details: [
        "Chrome and Safari work best for camera access",
        "Avoid using in-app browsers (like Instagram, Facebook)",
        "Try opening the link in your default browser",
        "Update your browser to the latest version"
      ]
    }
  ];

  const getBrowserSpecificInstructions = () => {
    const userAgent = typeof window !== 'undefined' ? navigator.userAgent : '';
    
    if (userAgent.includes('Chrome')) {
      return {
        browser: 'Chrome',
        instructions: [
          "Tap the lock icon in the address bar",
          "Select 'Permissions' or 'Site settings'",
          "Find 'Camera' and set it to 'Allow'",
          "Refresh the page"
        ]
      };
    } else if (userAgent.includes('Safari')) {
      return {
        browser: 'Safari',
        instructions: [
          "Tap 'aA' icon in the address bar",
          "Select 'Website Settings'",
          "Find 'Camera' and set it to 'Allow'",
          "Refresh the page"
        ]
      };
    } else if (userAgent.includes('Firefox')) {
      return {
        browser: 'Firefox',
        instructions: [
          "Tap the shield icon in the address bar",
          "Select 'Enhanced Tracking Protection'",
          "Allow camera access",
          "Refresh the page"
        ]
      };
    }
    
    return {
      browser: 'Your Browser',
      instructions: [
        "Look for a camera or lock icon in the address bar",
        "Tap it and allow camera permissions",
        "Refresh the page after allowing access"
      ]
    };
  };

  const browserInfo = getBrowserSpecificInstructions();

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Camera Access Issue</AlertTitle>
        <AlertDescription>
          {error || "Unable to access your device's camera. This is common on mobile devices."}
        </AlertDescription>
      </Alert>

      {!isHttps && (
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertTitle>Security Issue</AlertTitle>
          <AlertDescription>
            📱 <strong>Mobile users:</strong> Camera access requires a secure HTTPS connection. 
            Make sure the URL starts with "https://" not "http://".
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Quick Fix for {browserInfo.browser}
          </CardTitle>
          <CardDescription>
            Most camera issues can be fixed with these steps:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm">
            {browserInfo.instructions.map((instruction, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
                  {index + 1}
                </span>
                {instruction}
              </li>
            ))}
          </ol>
          
          {showRetryButton && onRetry && (
            <Button onClick={onRetry} className="w-full mt-4">
              <Camera className="mr-2 h-4 w-4" />
              Try Camera Again
            </Button>
          )}
        </CardContent>
      </Card>

      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full">
            <HelpCircle className="mr-2 h-4 w-4" />
            Detailed Troubleshooting Guide
            {isExpanded ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 mt-4">
          {troubleshootingSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card 
                key={index} 
                className={`cursor-pointer transition-all ${
                  currentStep === index ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setCurrentStep(currentStep === index ? -1 : index)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-5 w-5" />
                    Step {index + 1}: {step.title}
                  </CardTitle>
                  <CardDescription>{step.description}</CardDescription>
                </CardHeader>
                {currentStep === index && (
                  <CardContent className="pt-0">
                    <ul className="space-y-1 text-sm">
                      {step.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </CollapsibleContent>
      </Collapsible>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Still having issues?</h3>
              <p className="text-sm text-blue-800">
                If camera access still doesn't work, you can manually enter the QR code. 
                Ask your teacher to show you the code text, or try using a different device.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
