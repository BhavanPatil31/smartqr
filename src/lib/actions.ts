
'use server';

import { detectSuspiciousAttendance, type DetectSuspiciousAttendanceOutput } from '@/ai/flows/detect-suspicious-attendance';
import { getAttendanceForClass } from '@/ai/flows/get-attendance';
import { getCorrectStudentAttendanceRecords } from '@/lib/data';
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
        const { records: attendanceRecords, studentClasses } = await getCorrectStudentAttendanceRecords(studentId);

        let totalClassesHeld = 0;
        studentClasses.forEach(c => {
            // Assume 14 weeks in a semester
            totalClassesHeld += (c.schedules?.length || 0) * 14;
        });
        
        const attendedClasses = attendanceRecords.length;
        const totalClasses = Math.max(totalClassesHeld, attendedClasses);
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
