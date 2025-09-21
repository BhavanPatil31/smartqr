"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MessageSquare, Send, Users, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Class } from '@/lib/data';

interface TeacherMessageDialogProps {
  classItem: Class;
  teacherId: string;
  teacherName: string;
}

const MESSAGE_TEMPLATES = [
  { id: 'class_starting', text: 'Class is starting soon! Please join.', type: 'info' },
  { id: 'class_started', text: 'Class has started. Please come quickly!', type: 'warning' },
  { id: 'class_cancelled', text: 'Today\'s class has been cancelled.', type: 'info' },
  { id: 'room_changed', text: 'Class room has been changed. Check details.', type: 'warning' },
  { id: 'assignment_reminder', text: 'Don\'t forget about the assignment due next class.', type: 'info' },
  { id: 'exam_reminder', text: 'Exam is scheduled for next week. Prepare well!', type: 'warning' },
  { id: 'custom', text: '', type: 'info' }
];

export function TeacherMessageDialog({ classItem, teacherId, teacherName }: TeacherMessageDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'warning' | 'urgent'>('info');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async () => {
    const messageText = selectedTemplate === 'custom' 
      ? customMessage 
      : MESSAGE_TEMPLATES.find(t => t.id === selectedTemplate)?.text || '';

    if (!messageText.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a message or select a template.',
        variant: 'destructive'
      });
      return;
    }

    setIsSending(true);
    try {
      // Get all students in the same department and semester
      const studentsQuery = query(
        collection(db, 'students'),
        where('department', '==', classItem.department),
        where('semester', '==', classItem.semester)
      );
      
      const studentsSnapshot = await getDocs(studentsQuery);
      const studentIds = studentsSnapshot.docs.map(doc => doc.id);

      // Create notifications for each student
      const notificationPromises = studentIds.map(studentId => 
        addDoc(collection(db, 'notifications'), {
          studentId,
          classId: classItem.id,
          className: classItem.subject,
          teacherId,
          teacherName,
          type: 'teacher_message',
          priority: messageType === 'urgent' ? 'high' : messageType === 'warning' ? 'medium' : 'low',
          title: `Message from ${teacherName}`,
          message: messageText,
          read: false,
          timestamp: serverTimestamp(),
          department: classItem.department,
          semester: classItem.semester
        })
      );

      await Promise.all(notificationPromises);

      toast({
        title: 'Message Sent!',
        description: `Message sent to ${studentIds.length} students in ${classItem.semester}.`
      });

      // Reset form
      setSelectedTemplate('');
      setCustomMessage('');
      setMessageType('info');
      setIsOpen(false);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'urgent': return AlertTriangle;
      case 'warning': return AlertTriangle;
      case 'info': return Info;
      default: return Info;
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'info': return 'text-blue-600';
      default: return 'text-blue-600';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Send Message
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Send Message to Students
          </DialogTitle>
          <DialogDescription>
            Send a message to all students in <strong>{classItem.subject}</strong> ({classItem.semester})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Class Info */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4" />
              <span className="font-medium">Target Audience</span>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Subject: {classItem.subject}</p>
              <p>Department: {classItem.department}</p>
              <p>Semester: {classItem.semester}</p>
            </div>
          </div>

          {/* Message Templates */}
          <div className="space-y-2">
            <Label>Quick Templates</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a template or write custom message" />
              </SelectTrigger>
              <SelectContent>
                {MESSAGE_TEMPLATES.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.id === 'custom' ? 'Custom Message' : template.text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Message */}
          {selectedTemplate === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="custom-message">Custom Message</Label>
              <Textarea
                id="custom-message"
                placeholder="Type your message here..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {/* Message Type */}
          <div className="space-y-2">
            <Label>Message Priority</Label>
            <Select value={messageType} onValueChange={(value: 'info' | 'warning' | 'urgent') => setMessageType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    <span>Info - General information</span>
                  </div>
                </SelectItem>
                <SelectItem value="warning">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span>Warning - Important notice</span>
                  </div>
                </SelectItem>
                <SelectItem value="urgent">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span>Urgent - Immediate attention</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          {(selectedTemplate && selectedTemplate !== 'custom') || customMessage ? (
            <div className="p-3 border rounded-lg bg-blue-50">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">Message Preview</span>
              </div>
              <div className="text-sm">
                <p className="font-medium">From: {teacherName}</p>
                <p className="font-medium">Subject: {classItem.subject}</p>
                <p className="mt-2 p-2 bg-white rounded border">
                  {selectedTemplate === 'custom' 
                    ? customMessage 
                    : MESSAGE_TEMPLATES.find(t => t.id === selectedTemplate)?.text
                  }
                </p>
                <div className="mt-2">
                  <Badge 
                    variant="outline" 
                    className={`${
                      messageType === 'urgent' ? 'border-red-200 text-red-700' :
                      messageType === 'warning' ? 'border-yellow-200 text-yellow-700' :
                      'border-blue-200 text-blue-700'
                    }`}
                  >
                    {messageType.charAt(0).toUpperCase() + messageType.slice(1)} Priority
                  </Badge>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendMessage} 
            disabled={isSending || (!selectedTemplate || (selectedTemplate === 'custom' && !customMessage.trim()))}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {isSending ? 'Sending...' : 'Send Message'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
