
'use server';

import { detectSuspiciousAttendance, type DetectSuspiciousAttendanceOutput } from '@/ai/flows/detect-suspicious-attendance';
import type { AttendanceRecord } from '@/lib/data';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
        const attendanceCollectionRef = collection(db, 'classes', classId, 'attendance', date, 'records');
        const q = query(attendanceCollectionRef, orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            return [];
        }
        
        return querySnapshot.docs.map(doc => doc.data() as AttendanceRecord);
    } catch (error) {
        console.error(`Failed to get attendance for ${classId} on ${date}:`, error);
        // In a real app, you might want to handle this more gracefully
        // For now, we'll re-throw to be caught by the calling component
        throw new Error('Could not fetch attendance records.');
    }
}

    