
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
import { getStudentClasses, getCorrectStudentAttendanceRecords } from '@/lib/data';
import { eachDayOfInterval, format, getDay, isWithinInterval, parseISO, startOfDay, startOfWeek } from 'date-fns';
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
    
    const subjectStats: { [subject: string]: { attended: number; total: number } } = {};
    const historyRecords: StudentHistoryRecord[] = [];

    const semesterStartDate = startOfDay(parseISO('2024-07-15'));
    const today = startOfDay(new Date());

    if (today < semesterStartDate) {
        return { subjectStats: [], records: [] };
    }
    
    // Create a quick lookup for attendance records
    const attendanceMap = new Map<string, AttendanceRecord>();
    attendanceRecords.forEach(rec => {
        const dateStr = format(new Date(rec.timestamp), 'yyyy-MM-dd');
        attendanceMap.set(`${rec.usn}-${dateStr}`, rec);
    });

    studentClasses.forEach(c => {
        subjectStats[c.subject] = { attended: 0, total: 0 };

        c.schedules.forEach(schedule => {
            const classDay = DAY_MAP[schedule.day];
            if (classDay === undefined) return;

            const daysInSemester = eachDayOfInterval({
                start: semesterStartDate,
                end: today
            });
            
            daysInSemester.forEach(day => {
                if (getDay(day) === classDay) {
                    subjectStats[c.subject].total++;
                    
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const attendanceKey = `${c.id}-${dateStr}`; // Using classId + date to uniquely identify a session
                    
                    // A better way to find if the student attended THIS specific class on THIS day.
                    const attendedRecord = attendanceRecords.find(r => {
                       const recordDateStr = format(new Date(r.timestamp), 'yyyy-MM-dd');
                       // We need to know which class this record belongs to. This requires a schema change.
                       // For now, we will assume one class per day for a student for a subject. This is a limitation.
                       return recordDateStr === dateStr && subjectStats[c.subject];
                    });

                    let status: 'Present' | 'Absent' = 'Absent';
                    let markedAt: number | undefined = undefined;

                    if (attendedRecord) {
                         // This logic is imperfect without classId in the attendance record.
                         // We are checking if ANY class was attended on this day and crediting it.
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
                }
            });
        });
    });

    // We have to correct the attendance count now based on the generated records.
    const finalSubjectStats: { [subject: string]: { attended: number; total: number } } = {};
    historyRecords.forEach(rec => {
        if (!finalSubjectStats[rec.subject]) {
            finalSubjectStats[rec.subject] = { attended: 0, total: 0 };
        }
        finalSubjectStats[rec.subject].total++;
        if (rec.status === 'Present') {
            finalSubjectStats[rec.subject].attended++;
        }
    });

    return {
        subjectStats: Object.entries(finalSubjectStats).map(([subject, counts]) => ({
            subject,
            ...counts
        })),
        records: historyRecords,
    };
  }
);
