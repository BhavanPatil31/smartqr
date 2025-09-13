
'use server';

import type { DetectSuspiciousAttendanceOutput } from '@/ai/flows/detect-suspicious-attendance';
import { detectSuspiciousAttendance } from '@/ai/flows/detect-suspicious-attendance';
import { getAttendanceForClass } from '@/ai/flows/get-attendance';
import { getStudentHistory } from '@/ai/flows/get-student-history';
import { getStudentStats } from '@/ai/flows/get-student-stats';
import type { AttendanceRecord } from '@/lib/data';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { revalidatePath, unstable_noStore as noStore } from 'next/cache';
import { db } from './firebase';

export async function checkSuspiciousActivityAction(
  classId: string,
  attendanceRecords: AttendanceRecord[]
): Promise<DetectSuspiciousAttendanceOutput> {
  try {
    // Always normalize data before calling AI
    const formattedRecords = attendanceRecords.map((record) => ({
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
  } catch (error) {
    console.error('AI analysis failed in checkSuspiciousActivityAction:', error);
    throw new Error('Could not perform AI attendance analysis.');
  }
}

export async function getAttendanceForDate(
  classId: string,
  date: string
): Promise<AttendanceRecord[]> {
  noStore();
  try {
    const records = await getAttendanceForClass({ classId, date });
    return records;
  } catch (error) {
    console.error(
      `Failed to get attendance for class ${classId} on ${date}:`,
      error
    );
    throw new Error('Could not fetch attendance records.');
  }
}

export async function getStudentAttendanceStats(studentId: string) {
  try {
    const stats = await getStudentStats({ studentId });
    return stats;
  } catch (error) {
    console.error(
      `Failed to calculate student stats for student ${studentId}:`,
      error
    );
    throw new Error('Could not calculate attendance stats.');
  }
}

export async function getStudentHistoryAction(studentId: string) {
  try {
    const history = await getStudentHistory({ studentId });
    return history;
  } catch (error) {
    console.error(
      `Failed to fetch student history for student ${studentId}:`,
      error
    );
    throw new Error('Could not fetch student history.');
  }
}

export async function updateClassAction(classId: string, classData: any) {
  try {
    const classDocRef = doc(db, 'classes', classId);

    const cleanedData = { ...classData };

    Object.keys(cleanedData).forEach((key) => {
      if (cleanedData[key] === undefined) {
        delete cleanedData[key];
      }
    });

    if (
      isNaN(cleanedData.maxStudents) ||
      cleanedData.maxStudents === 0 ||
      cleanedData.maxStudents === ''
    ) {
      delete cleanedData.maxStudents;
    }

    await updateDoc(classDocRef, cleanedData);

    revalidatePath('/teacher/dashboard');
    revalidatePath(`/teacher/class/${classId}`);
    revalidatePath(`/teacher/edit-class/${classId}`);
  } catch (error) {
    console.error(`Error updating class ${classId}:`, error);
    throw new Error('Could not update class.');
  }
}

export async function deleteClassAction(classId: string) {
  try {
    const classDocRef = doc(db, 'classes', classId);
    await deleteDoc(classDocRef);

    revalidatePath('/teacher/dashboard');
    revalidatePath(`/teacher/class/${classId}`);
  } catch (error) {
    console.error(`Error deleting class ${classId}:`, error);
    throw new Error('Could not delete class.');
  }
}
