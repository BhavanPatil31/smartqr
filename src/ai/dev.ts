
import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-attendance.ts';
import '@/ai/flows/detect-suspicious-attendance.ts';
import '@/ai/flows/get-attendance.ts';
import '@/ai/flows/get-student-stats.ts';
import '@/ai/flows/get-student-history.ts';
