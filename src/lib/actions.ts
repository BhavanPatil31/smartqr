
'use server';

import { detectSuspiciousAttendance, type DetectSuspiciousAttendanceOutput } from '@/ai/flows/detect-suspicious-attendance';
import { getAttendanceForClass } from '@/ai/flows/get-attendance';
import { getStudentStats } from '@/ai/flows/get-student-stats';
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
    noStore(); 
    try {
        const records = await getAttendanceForClass({ classId, date });
        return records;
    } catch (error) {
        console.error(`Failed to get attendance for ${classId} on ${date}:`, error);
        throw new Error('Could not fetch attendance records.');
    }
}

export async function getStudentAttendanceStats(studentId: string) {
    noStore();
    try {
        const stats = await getStudentStats({ studentId });
        return stats;
    } catch (error) {
        console.error("Failed to calculate student attendance stats:", error);
        throw new Error('Could not calculate attendance stats.');
    }
}
