
'use server';

import { detectSuspiciousAttendance, type DetectSuspiciousAttendanceOutput } from '@/ai/flows/detect-suspicious-attendance';
import { getAttendanceForClass } from '@/ai/flows/get-attendance';
import { getAllStudentAttendanceRecords, getStudentClasses } from '@/lib/data';
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

export async function getStudentAttendanceStats(studentId: string, department: string, semester: string) {
    noStore();
    try {
        const studentClasses = await getStudentClasses(department, semester);
        const attendanceRecords = await getAllStudentAttendanceRecords(studentId);

        // This is a simplified calculation. It assumes one class session per day per class schedule.
        // A more complex system might track total number of classes held.
        const today = new Date();
        let totalClassesHeld = 0;

        studentClasses.forEach(c => {
            c.schedules.forEach(s => {
                // A rough estimate of total classes held so far in a semester (e.g., 14 weeks)
                // This is not perfect but gives a baseline.
                 totalClassesHeld += 14; 
            });
        });
        
        const attendedClasses = attendanceRecords.length;
        const totalClasses = totalClassesHeld > 0 ? totalClassesHeld : attendedClasses; // Avoid division by zero
        const missedClasses = Math.max(0, totalClasses - attendedClasses);
        const attendanceRate = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;
        
        return {
            totalClasses,
            attendedClasses,
            missedClasses,
            attendanceRate
        };

    } catch (error) {
        console.error("Failed to calculate student attendance stats:", error);
        throw new Error('Could not calculate attendance stats.');
    }
}
