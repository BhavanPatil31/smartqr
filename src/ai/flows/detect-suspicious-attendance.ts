// src/ai/flows/detect-suspicious-attendance.ts
'use server';

/**
 * @fileOverview Detects suspicious attendance patterns, such as the same device scanning for multiple students in a short period.
 *
 * - detectSuspiciousAttendance - A function that flags suspicious attendance.
 * - DetectSuspiciousAttendanceInput - The input type for the detectSuspiciousAttendance function.
 * - DetectSuspiciousAttendanceOutput - The return type for the detectSuspiciousAttendance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectSuspiciousAttendanceInputSchema = z.object({
  classId: z.string().describe('The ID of the class.'),
  date: z.string().describe('The date of the attendance record (YYYY-MM-DD).'),
  attendanceRecords: z.array(
    z.object({
      studentId: z.string().describe('The ID of the student.'),
      timestamp: z.number().describe('The timestamp of the attendance record.'),
      deviceInfo: z.string().optional().describe('Information about the device used for scanning (e.g., IP address, device ID).'),
    })
  ).describe('An array of attendance records for the class and date.'),
  suspiciousTimeWindow: z.number().default(60).describe('The time window (in seconds) to check for multiple scans from the same device.'),
  maxScansPerDevice: z.number().default(3).describe('The maximum number of scans allowed from the same device within the time window.'),
});

export type DetectSuspiciousAttendanceInput = z.infer<typeof DetectSuspiciousAttendanceInputSchema>;

const SuspiciousRecordSchema = z.object({
  studentId: z.string().describe('The ID of the student involved in the suspicious activity.'),
  timestamp: z.number().describe('The timestamp of the suspicious attendance record.'),
  deviceInfo: z.string().optional().describe('Information about the device used for scanning.'),
});

const DetectSuspiciousAttendanceOutputSchema = z.object({
  isSuspicious: z.boolean().describe('Whether or not suspicious attendance patterns were detected.'),
  suspiciousRecords: z.array(SuspiciousRecordSchema).describe('An array of suspicious attendance records.'),
  summary: z.string().describe('A summary of the suspicious activity, if any.'),
});

export type DetectSuspiciousAttendanceOutput = z.infer<typeof DetectSuspiciousAttendanceOutputSchema>;

export async function detectSuspiciousAttendance(input: DetectSuspiciousAttendanceInput): Promise<DetectSuspiciousAttendanceOutput> {
  return detectSuspiciousAttendanceFlow(input);
}

const detectSuspiciousAttendanceFlow = ai.defineFlow(
  {
    name: 'detectSuspiciousAttendanceFlow',
    inputSchema: DetectSuspiciousAttendanceInputSchema,
    outputSchema: DetectSuspiciousAttendanceOutputSchema,
  },
  async input => {
    const suspiciousRecords: z.infer<typeof SuspiciousRecordSchema>[] = [];
    const deviceScanCounts: { [deviceInfo: string]: { count: number; records: DetectSuspiciousAttendanceInput['attendanceRecords'] } } = {};

    for (const record of input.attendanceRecords) {
      if (!record.deviceInfo) {
        continue; // Skip records without device information
      }

      if (!deviceScanCounts[record.deviceInfo]) {
        deviceScanCounts[record.deviceInfo] = { count: 0, records: [] };
      }

      deviceScanCounts[record.deviceInfo].count++;
      deviceScanCounts[record.deviceInfo].records.push(record);

      if (deviceScanCounts[record.deviceInfo].count > input.maxScansPerDevice) {
        suspiciousRecords.push({
          studentId: record.studentId,
          timestamp: record.timestamp,
          deviceInfo: record.deviceInfo,
        });
      }
    }

    const isSuspicious = suspiciousRecords.length > 0;
    let summary = '';

    if (isSuspicious) {
      summary = `Detected ${suspiciousRecords.length} suspicious attendance records.`;
    } else {
      summary = 'No suspicious attendance patterns detected.';
    }

    return {
      isSuspicious,
      suspiciousRecords,
      summary,
    };
  }
);

