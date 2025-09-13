'use server';
/**
 * @fileOverview Securely fetches attendance records for a specific class and date.
 *
 * - getAttendanceForClass - A function that retrieves attendance records.
 * - GetAttendanceInput - The input type for the getAttendanceForClass function.
 * - GetAttendanceOutput - The return type for the getAttendanceForClass function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AttendanceRecord, Class } from '@/lib/data';

const GetAttendanceInputSchema = z.object({
  classId: z.string().describe('The ID of the class.'),
  date: z.string().describe('The date to fetch attendance for (YYYY-MM-DD).'),
});
export type GetAttendanceInput = z.infer<typeof GetAttendanceInputSchema>;

const AttendanceRecordSchema = z.object({
    studentId: z.string(),
    studentName: z.string(),
    usn: z.string(),
    timestamp: z.number(),
    deviceInfo: z.string(),
    classId: z.string(),
    subject: z.string(),
});

const GetAttendanceOutputSchema = z.array(AttendanceRecordSchema);
export type GetAttendanceOutput = z.infer<typeof GetAttendanceOutputSchema>;


export async function getAttendanceForClass(input: GetAttendanceInput): Promise<GetAttendanceOutput> {
  return getAttendanceFlow(input);
}

const getAttendanceFlow = ai.defineFlow(
  {
    name: 'getAttendanceFlow',
    inputSchema: GetAttendanceInputSchema,
    outputSchema: GetAttendanceOutputSchema,
  },
  async ({ classId, date }) => {
    try {
        const classDocRef = doc(db, 'classes', classId);
        const classDocSnap = await getDoc(classDocRef);

        if (!classDocSnap.exists()) {
            throw new Error(`Class with ID ${classId} not found.`);
        }
        const classData = classDocSnap.data() as Class;

        const attendanceCollectionRef = collection(db, 'classes', classId, 'attendance', date, 'records');
        const q = query(attendanceCollectionRef, orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            return [];
        }
        
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                classId: classId,
                subject: classData.subject
            } as AttendanceRecord;
        });
    } catch (error) {
        console.error(`Flow Error: Failed to get attendance for ${classId} on ${date}:`, error);
        throw new Error('Could not fetch attendance records from flow.');
    }
  }
);