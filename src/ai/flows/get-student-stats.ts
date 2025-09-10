
'use server';
/**
 * @fileOverview Calculates and returns attendance statistics for a specific student.
 *
 * - getStudentStats - A function that calculates attendance statistics.
 * - GetStudentStatsInput - The input type for the getStudentStats function.
 * - GetStudentStatsOutput - The return type for the getStudentStats function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getCorrectStudentAttendanceRecords } from '@/lib/data';
import { eachDayOfInterval, getDay, parseISO, startOfDay } from 'date-fns';

const GetStudentStatsInputSchema = z.object({
  studentId: z.string().describe('The ID of the student.'),
});
export type GetStudentStatsInput = z.infer<typeof GetStudentStatsInputSchema>;

const GetStudentStatsOutputSchema = z.object({
    totalClasses: z.number(),
    attendedClasses: z.number(),
    missedClasses: z.number(),
    attendanceRate: z.number(),
});
export type GetStudentStatsOutput = z.infer<typeof GetStudentStatsOutputSchema>;

const DAY_MAP: { [key: string]: number } = {
    "Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6,
};

export async function getStudentStats(input: GetStudentStatsInput): Promise<GetStudentStatsOutput> {
  return getStudentStatsFlow(input);
}

const getStudentStatsFlow = ai.defineFlow(
  {
    name: 'getStudentStatsFlow',
    inputSchema: GetStudentStatsInputSchema,
    outputSchema: GetStudentStatsOutputSchema,
  },
  async ({ studentId }) => {
    try {
        const { records: attendanceRecords, studentClasses } = await getCorrectStudentAttendanceRecords(studentId);

        let totalClassesHeld = 0;
        
        const semesterStartDate = startOfDay(parseISO('2024-07-15'));
        const today = startOfDay(new Date());
        
        if (today >= semesterStartDate && studentClasses.length > 0) {
            const daysInSemesterSoFar = eachDayOfInterval({
                start: semesterStartDate,
                end: today
            });

            studentClasses.forEach(c => {
                daysInSemesterSoFar.forEach(day => {
                    const dayOfWeek = getDay(day); // 0 for Sunday, 1 for Monday, etc.
                    const relevantSchedules = c.schedules.filter(schedule => DAY_MAP[schedule.day] === dayOfWeek);
                    totalClassesHeld += relevantSchedules.length;
                });
            });
        }
        
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
        console.error(`Flow Error: Failed to get stats for ${studentId}:`, error);
        throw new Error('Could not calculate attendance stats from flow.');
    }
  }
);
