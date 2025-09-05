'use server';

/**
 * @fileOverview Provides a summary of student attendance for a given class, highlighting students with low attendance and potential reasons for absences.
 *
 * - summarizeAttendance - A function that generates an attendance summary for a class.
 * - SummarizeAttendanceInput - The input type for the summarizeAttendance function.
 * - SummarizeAttendanceOutput - The return type for the summarizeAttendance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeAttendanceInputSchema = z.object({
  classId: z.string().describe('The ID of the class to summarize attendance for.'),
  className: z.string().describe('The name of the class.'),
  date: z.string().describe('The date to summarize attendance for.'),
  attendanceData: z
    .string()
    .describe(
      'Attendance data to analyze.  Should be formatted as a stringified JSON array of objects, each containing student name, USN, and timestamp.'
    ),
  teacherName: z.string().describe('The name of the teacher.'),
});
export type SummarizeAttendanceInput = z.infer<typeof SummarizeAttendanceInputSchema>;

const SummarizeAttendanceOutputSchema = z.object({
  summary: z.string().describe('A summary of the attendance for the class.'),
});
export type SummarizeAttendanceOutput = z.infer<typeof SummarizeAttendanceOutputSchema>;

export async function summarizeAttendance(input: SummarizeAttendanceInput): Promise<SummarizeAttendanceOutput> {
  return summarizeAttendanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeAttendancePrompt',
  input: {schema: SummarizeAttendanceInputSchema},
  output: {schema: SummarizeAttendanceOutputSchema},
  prompt: `You are an AI assistant helping teachers understand class attendance.

You are provided with attendance data for a specific class on a specific date.

Class Name: {{{className}}}
Date: {{{date}}}
Teacher Name: {{{teacherName}}}

You will generate a summary of the attendance data, highlighting any students with low attendance or potential reasons for absences.  If no students are present, state that explicitly.  Mention the names of any absent students.

Attendance Data:
{{attendanceData}}
`,
});

const summarizeAttendanceFlow = ai.defineFlow(
  {
    name: 'summarizeAttendanceFlow',
    inputSchema: SummarizeAttendanceInputSchema,
    outputSchema: SummarizeAttendanceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
