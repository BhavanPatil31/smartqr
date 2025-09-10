
'use server';
/**
 * @fileOverview Calculates and returns detailed attendance history for a specific student.
 *
 * - getStudentHistory - A function that calculates detailed attendance history.
 * - GetStudentHistoryInput - The input type for the getStudentHistory function.
 * - GetStudentHistoryOutput - The return type for the getStudentHistory function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getCorrectStudentAttendanceRecords } from '@/lib/data';
import { eachDayOfInterval, format, getDay, isWithinInterval, parseISO, startOfDay, startOfWeek, toDate } from 'date-fns';
import type { AttendanceRecord, Class } from '@/lib/data';

const GetStudentHistoryInputSchema = z.object({
  studentId: z.string().describe('The ID of the student.'),
});
export type GetStudentHistoryInput = z.infer<typeof GetStudentHistoryInputSchema>;

const DAY_MAP: { [key: string]: number } = {
    "Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6,
};

const SubjectStatSchema = z.object({
    subject: z.string(),
    attended: z.number(),
    total: z.number(),
});
export type SubjectStat = z.infer<typeof SubjectStatSchema>;

const StudentHistoryRecordSchema = z.object({
    subject: z.string(),
    teacherName: z.string(),
    date: z.string(), // YYYY-MM-DD
    startTime: z.string(),
    endTime: z.string(),
    status: z.enum(['Present', 'Absent']),
    markedAt: z.number().optional(),
});
export type StudentHistoryRecord = z.infer<typeof StudentHistoryRecordSchema>;

const GetStudentHistoryOutputSchema = z.object({
    subjectStats: z.array(SubjectStatSchema),
    records: z.array(StudentHistoryRecordSchema),
});
export type GetStudentHistoryOutput = z.infer<typeof GetStudentHistoryOutputSchema>;


export async function getStudentHistory(input: GetStudentHistoryInput): Promise<GetStudentHistoryOutput> {
  return getStudentHistoryFlow(input);
}

const getStudentHistoryFlow = ai.defineFlow(
  {
    name: 'getStudentHistoryFlow',
    inputSchema: GetStudentHistoryInputSchema,
    outputSchema: GetStudentHistoryOutputSchema,
  },
  async ({ studentId }) => {
    const { records: attendanceRecords, studentClasses } = await getCorrectStudentAttendanceRecords(studentId);
    
    // If student has no classes assigned, return empty data immediately.
    if (studentClasses.length === 0) {
        return { subjectStats: [], records: [] };
    }

    const subjectStats: { [subject: string]: { attended: number; total: number } } = {};
    const historyRecords: StudentHistoryRecord[] = [];

    const semesterStartDate = startOfDay(parseISO('2024-07-15'));
    const today = startOfDay(new Date());

    if (today < semesterStartDate) {
        return { subjectStats: [], records: [] };
    }
    
    // Create a quick lookup for attendance records: key is "classId-date"
    const attendanceMap = new Map<string, AttendanceRecord>();
    attendanceRecords.forEach(rec => {
        const dateStr = format(new Date(rec.timestamp), 'yyyy-MM-dd');
        attendanceMap.set(`${rec.classId}-${dateStr}`, rec);
    });

    studentClasses.forEach(c => {
        // Initialize stats for each subject
        subjectStats[c.subject] = { attended: 0, total: 0 };

        const daysInSemesterSoFar = eachDayOfInterval({
            start: semesterStartDate,
            end: today
        });
        
        // Find all days this class was scheduled to happen
        daysInSemesterSoFar.forEach(day => {
            const dayOfWeek = getDay(day); // 0 for Sunday, 1 for Monday, etc.
            
            const relevantSchedules = c.schedules.filter(schedule => DAY_MAP[schedule.day] === dayOfWeek);

            relevantSchedules.forEach(schedule => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const attendanceKey = `${c.id}-${dateStr}`;

                const attendedRecord = attendanceMap.get(attendanceKey);

                let status: 'Present' | 'Absent' = 'Absent';
                let markedAt: number | undefined = undefined;

                subjectStats[c.subject].total++;

                if (attendedRecord) {
                    status = 'Present';
                    markedAt = attendedRecord.timestamp;
                    subjectStats[c.subject].attended++;
                }
                
                historyRecords.push({
                    subject: c.subject,
                    teacherName: c.teacherName,
                    date: dateStr,
                    startTime: schedule.startTime,
                    endTime: schedule.endTime,
                    status,
                    markedAt,
                });
            });
        });
    });
    
    return {
        subjectStats: Object.entries(subjectStats).map(([subject, counts]) => ({
            subject,
            ...counts
        })),
        records: historyRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    };
  }
);
