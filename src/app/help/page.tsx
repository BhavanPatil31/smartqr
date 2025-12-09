import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle, Mail, MessageCircle, FileText } from 'lucide-react';

export default function HelpPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background gradient-bg">
      <Header />
      <main className="flex-1 container py-10 px-4 md:px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-4 text-center">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl gradient-text">
              Help & Support
            </h1>
            <p className="text-muted-foreground md:text-xl">
              Find answers to common questions and learn how to get the most out of SmartQR.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Documentation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Detailed guides on how to use all features of the platform.
                </p>
                <a href="#" className="text-sm font-medium text-primary hover:underline">
                  Read Guides &rarr;
                </a>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  Community
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Join our community forum to discuss and share tips.
                </p>
                <a href="#" className="text-sm font-medium text-primary hover:underline">
                  Visit Forum &rarr;
                </a>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Contact Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Need help with your account? Reach out to our team.
                </p>
                <a href="mailto:support@smartqr.com" className="text-sm font-medium text-primary hover:underline">
                  Email Us &rarr;
                </a>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>
                Quick answers to the most common questions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>How do I reset my password?</AccordionTrigger>
                  <AccordionContent>
                    You can reset your password by clicking on the "Forgot Password" link on the login page. Follow the instructions sent to your email.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>How does the QR attendance work?</AccordionTrigger>
                  <AccordionContent>
                    Teachers generate a unique QR code for each class session. Students scan this code using the SmartQR app or website to mark their attendance instantly.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>Can I edit attendance records?</AccordionTrigger>
                  <AccordionContent>
                    Yes, teachers and admins can manually edit attendance records if needed. Go to the class report and select the student to update their status.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>Is my data secure?</AccordionTrigger>
                  <AccordionContent>
                    Absolutely. We use industry-standard encryption to protect your personal information and attendance data.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </main>
      <footer className="py-6 w-full border-t text-center text-xs text-muted-foreground">
        &copy; 2024 SmartQR. All rights reserved.
      </footer>
    </div>
  );
}
