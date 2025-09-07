
'use server';

import { detectSuspiciousAttendance, type DetectSuspiciousAttendanceOutput } from '@/ai/flows/detect-suspicious-attendance';
import { getAttendanceForClass } from '@/ai/flows/get-attendance';
import type { AttendanceRecord } from '@/lib/data';
import { unstable_noStore as noStore } from 'next/cache';

export async function checkSuspiciousActivityAction(classId: string, attendanceRecords: AttendanceRecord[]): Promise<DetectSuspiciousAttendanceOutput> {
    const formattedRecords = attendanceRecords.map(record => ({
        studentId: record.studentId,
        timestamp: record.timestamp,
        deviceInfo: record.deviceInfo,
    }));

    const output = await detectSuspiciousAttendance({
        classId: classId,
        date: new Date().toISOString().split('T')[0],
        attendanceRecords: formattedRecords,
    });
    
    return output;
}

export async function getAttendanceForDate(classId: string, date: string): Promise<AttendanceRecord[]> {
    noStore(); // Opt out of caching for this server action
    try {
        // Call the secure Genkit flow instead of a direct DB query
        const records = await getAttendanceForClass({ classId, date });
        return records;
    } catch (error) {
        console.error(`Failed to get attendance for ${classId} on ${date}:`, error);
        // In a real app, you might want to handle this more gracefully
        // For now, we'll re-throw to be caught by the calling component
        throw new Error('Could not fetch attendance records.');
    }
}
