import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-attendance.ts';
import '@/ai/flows/detect-suspicious-attendance.ts';