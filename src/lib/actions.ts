
'use server';

import { detectSuspiciousAttendance, type DetectSuspiciousAttendanceOutput } from '@/ai/flows/detect-suspicious-attendance';
import { getAttendanceForClass } from '@/ai/flows/get-attendance';
import { getCorrectStudentAttendanceRecords, getStudentClasses } from '@/lib/data';
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
        // Use the corrected function to fetch records
        const attendanceRecords = await getCorrectStudentAttendanceRecords(studentId, department, semester);

        // This is a simplified calculation. It assumes one class session per day per class schedule.
        // A more complex system might track total number of classes held.
        // For now, we will calculate based on a 14-week semester for an estimate.
        let totalClassesHeld = 0;

        studentClasses.forEach(c => {
            // For each class, multiply the number of weekly sessions by 14.
            totalClassesHeld += (c.schedules?.length || 0) * 14;
        });
        
        const attendedClasses = attendanceRecords.length;
        // Ensure totalClasses is at least the number of attended classes
        const totalClasses = totalClassesHeld > attendedClasses ? totalClassesHeld : attendedClasses;
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
