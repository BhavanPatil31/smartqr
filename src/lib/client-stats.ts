import { collection, getDocs, getDoc, doc, query, where, collectionGroup } from 'firebase/firestore';
import { db } from './firebase';
import { eachDayOfInterval, getDay, parseISO, startOfDay, format } from 'date-fns';
import type { AttendanceRecord, Class, StudentProfile } from './data';
import { getStudentClasses } from './data';

const DAY_MAP: { [key: string]: number } = {
    "Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6,
};

export interface AttendanceStats {
    totalClasses: number;
    attendedClasses: number;
    missedClasses: number;
    attendanceRate: number;
}


export const getCorrectStudentAttendanceRecords = async (studentId: string): Promise<{ records: AttendanceRecord[], studentClasses: Class[] }> => {
    const studentDocRef = doc(db, 'students', studentId);
    const studentDocSnap = await getDoc(studentDocRef);

    if (!studentDocSnap.exists()) {
        console.warn(`No profile found for student ${studentId}`);
        return { records: [], studentClasses: [] };
    }

    const studentProfile = studentDocSnap.data() as StudentProfile;
    const { department, semester } = studentProfile;

    if (!department || !semester) {
        return { records: [], studentClasses: [] };
    }
    
    // 1. Get all classes the student is enrolled in.
    const studentClasses = await getStudentClasses(department, semester);
    
    // 2. Fetch attendance records from each class individually to avoid collection group index requirement
    const allRecords: AttendanceRecord[] = [];
    
    for (const classItem of studentClasses) {
        try {
            // Get all attendance dates for this class
            const attendanceCollectionRef = collection(db, 'classes', classItem.id, 'attendance');
            const attendanceSnapshot = await getDocs(attendanceCollectionRef);
            
            for (const dateDoc of attendanceSnapshot.docs) {
                const recordsCollectionRef = collection(db, 'classes', classItem.id, 'attendance', dateDoc.id, 'records');
                const recordsQuery = query(recordsCollectionRef, where('studentId', '==', studentId));
                const recordsSnapshot = await getDocs(recordsQuery);
                
                const classRecords = recordsSnapshot.docs.map(doc => ({
                    ...doc.data() as AttendanceRecord,
                    classId: classItem.id // Ensure classId is included
                }));
                allRecords.push(...classRecords);
            }
        } catch (error) {
            console.warn(`Failed to fetch records for class ${classItem.id}:`, error);
            // Continue with other classes even if one fails
        }
    }
    
    return { records: allRecords, studentClasses };
};

export const calculateStudentAttendanceStats = async (studentId: string): Promise<AttendanceStats> => {
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
        console.error(`Failed to calculate stats for ${studentId}:`, error);
        throw new Error('Could not calculate attendance stats.');
    }
};

export interface StudentHistoryRecord {
    classId: string;
    subject: string;
    date: string;
    attended: boolean;
    timestamp?: number;
}

export interface GetStudentHistoryOutput {
    subjectStats: Array<{
        subject: string;
        attended: number;
        total: number;
        percentage: number;
    }>;
    records: StudentHistoryRecord[];
}

export const calculateStudentHistory = async (studentId: string): Promise<GetStudentHistoryOutput> => {
    try {
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

        studentClasses.forEach(classItem => {
            const daysInSemesterSoFar = eachDayOfInterval({
                start: semesterStartDate,
                end: today
            });

            daysInSemesterSoFar.forEach(day => {
                const dayOfWeek = getDay(day);
                const relevantSchedules = classItem.schedules.filter(schedule => DAY_MAP[schedule.day] === dayOfWeek);
                
                relevantSchedules.forEach(schedule => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const attendanceKey = `${classItem.id}-${dateStr}`;
                    const attendanceRecord = attendanceMap.get(attendanceKey);
                    
                    const attended = !!attendanceRecord;
                    
                    // Update subject stats
                    if (!subjectStats[classItem.subject]) {
                        subjectStats[classItem.subject] = { attended: 0, total: 0 };
                    }
                    subjectStats[classItem.subject].total++;
                    if (attended) {
                        subjectStats[classItem.subject].attended++;
                    }
                    
                    // Add to history records
                    historyRecords.push({
                        classId: classItem.id,
                        subject: classItem.subject,
                        date: dateStr,
                        attended,
                        timestamp: attendanceRecord?.timestamp
                    });
                });
            });
        });

        // Convert subject stats to array format
        const subjectStatsArray = Object.entries(subjectStats).map(([subject, stats]) => ({
            subject,
            attended: stats.attended,
            total: stats.total,
            percentage: stats.total > 0 ? Math.round((stats.attended / stats.total) * 100) : 0
        }));

        return {
            subjectStats: subjectStatsArray,
            records: historyRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        };

    } catch (error) {
        console.error(`Failed to calculate history for ${studentId}:`, error);
        throw new Error('Could not calculate student history.');
    }
};
