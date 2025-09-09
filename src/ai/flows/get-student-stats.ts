
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
import { differenceInWeeks, parseISO } from 'date-fns';

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
        
        // A more accurate system to calculate total classes held up to today.
        // We can assume a fixed start date for the current semester.
        const semesterStartDate = parseISO('2024-07-15');
        const today = new Date();
        const weeksPassed = differenceInWeeks(today, semesterStartDate) + 1;

        if (studentClasses.length > 0 && weeksPassed > 0) {
            studentClasses.forEach(c => {
                totalClassesHeld += (c.schedules?.length || 0) * weeksPassed;
            });
        }
        
        const attendedClasses = attendanceRecords.length;
        // Base total classes on the higher of estimated held classes or actual attended classes.
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
