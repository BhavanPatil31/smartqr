
import { collection, getDocs, getDoc, doc, query, where, collectionGroup, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { startOfDay, endOfDay } from 'date-fns';

// Interface definitions remain the same
export interface Student {
    id: string;
    name: string;
    usn: string;
    semester: number;
    department: string;
}

export interface StudentProfile {
    fullName: string;
    usn: string;
    email: string;
    phoneNumber: string;
    semester: string;
    department: string;
}

export interface Teacher {
    id: string;
    name: string;
    email: string;
    department: string;
}

export interface TeacherProfile {
    fullName: string;
    email: string;
    phoneNumber: string;
    department: string;
    isApproved?: boolean;
    approvedBy?: string;
    approvedAt?: number;
    registeredAt?: number;
}

export interface AdminProfile {
    fullName: string;
    email: string;
    department: string;
}

export interface Schedule {
    day: string;
    startTime: string;
    endTime: string;
    roomNumber: string;
}

export interface Class {
    id: string;
    subject: string;
    semester: string;
    department: string;
    teacherId: string;
    teacherName: string;
    schedules: Schedule[];
    maxStudents?: number;
    qrCode?: string;
    qrCodeGeneratedAt?: number;
    qrCodeExpiresAt?: number;
}

export interface AttendanceRecord {
    studentId: string;
    studentName: string;
    usn: string;
    timestamp: number;
    deviceInfo: string;
    classId: string;
    subject: string;
}

// DATA ACCESS FUNCTIONS using Firestore

export const getStudentClasses = async (department: string, semester: string) => {
    if (!department || !semester) return [];
    const q = query(
        collection(db, 'classes'),
        where('department', '==', department),
        where('semester', '==', semester)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));
};

export const getTeacherClasses = async (teacherId: string) => {
    const q = query(
        collection(db, 'classes'), 
        where('teacherId', '==', teacherId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));
};

export const getClassById = async (classId: string): Promise<Class | null> => {
    const docRef = doc(db, 'classes', classId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const classData = { id: docSnap.id, ...docSnap.data() } as Class;
        return classData;
    }
    return null;
};

export const getTeacherById = async (teacherId: string): Promise<TeacherProfile | null> => {
     const docRef = doc(db, 'teachers', teacherId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data() as TeacherProfile;
    }
    return null;
};

export const getAttendanceForClassOnDate = (classId: string, date: string): AttendanceRecord[] => {
    // This will be replaced with a firestore query in the next step.
    return [];
};

// Admin data functions
export const getClassesByDepartment = async (department: string) => {
    if (!department) return [];
    const q = query(
        collection(db, 'classes'), 
        where('department', '==', department)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));
}

export const getTeachersByDepartment = async (department: string): Promise<(TeacherProfile & { id: string })[]> => {
    if (!department) return [];
    const q = query(collection(db, 'teachers'), where('department', '==', department));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeacherProfile & { id: string }));
}

export const getStudentsByDepartment = async (department: string): Promise<(StudentProfile & { id: string })[]> => {
    if (!department) return [];
    const q = query(collection(db, 'students'), where('department', '==', department));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentProfile & { id: string }));
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
    
    // 2. Query each class's records collection individually to avoid collection group query
    const allRecords: AttendanceRecord[] = [];
    
    for (const classItem of studentClasses) {
        try {
            const recordsQuery = query(
                collection(db, 'classes', classItem.id, 'records'), 
                where('studentId', '==', studentId)
            );
            const recordsSnapshot = await getDocs(recordsQuery);
            const classRecords = recordsSnapshot.docs.map(doc => doc.data() as AttendanceRecord);
            allRecords.push(...classRecords);
        } catch (error) {
            console.warn(`Error fetching records for class ${classItem.id}:`, error);
            // Continue with other classes even if one fails
        }
    }
    
    return { records: allRecords, studentClasses };
};

// Helper function to check if a class is currently live/active
export const isClassCurrentlyLive = (classItem: Class): boolean => {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert to minutes since midnight
    
    // Check if any schedule for this class is currently active
    return classItem.schedules?.some(schedule => {
        if (schedule.day !== currentDay) return false;
        
        // Parse start and end times (assuming format like "09:00" or "14:30")
        const [startHour, startMin] = schedule.startTime.split(':').map(Number);
        const [endHour, endMin] = schedule.endTime.split(':').map(Number);
        
        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;
        
        // Class is live if current time is within the schedule window
        return currentTime >= startTime && currentTime <= endTime;
    }) || false;
};

// Get only live/active classes for a student
export const getLiveStudentClasses = async (department: string, semester: string): Promise<Class[]> => {
    const allClasses = await getStudentClasses(department, semester);
    return allClasses.filter(classItem => isClassCurrentlyLive(classItem));
};

// Get classes that student has previously attended
export const getPreviousStudentClasses = async (studentId: string): Promise<Class[]> => {
    const { records, studentClasses } = await getCorrectStudentAttendanceRecords(studentId);
    
    // Get unique class IDs from attendance records
    const attendedClassIds = new Set(records.map(record => record.classId));
    
    // Filter classes to only include those the student has attended
    return studentClasses.filter(classItem => attendedClassIds.has(classItem.id));
};

// Check if student has marked attendance for a specific class today
export const hasStudentMarkedAttendanceToday = async (studentId: string, classId: string): Promise<boolean> => {
    try {
        const { records } = await getCorrectStudentAttendanceRecords(studentId);
        const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
        
        // Check if there's any attendance record for this class today
        return records.some(record => {
            const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
            return record.classId === classId && recordDate === today;
        });
    } catch (error) {
        console.error('Error checking attendance status:', error);
        return false;
    }
};

// Get attendance status for multiple classes for a student
export const getAttendanceStatusForClasses = async (studentId: string, classIds: string[]): Promise<Record<string, boolean>> => {
    try {
        const { records } = await getCorrectStudentAttendanceRecords(studentId);
        const today = new Date().toISOString().split('T')[0];
        
        const attendanceStatus: Record<string, boolean> = {};
        
        classIds.forEach(classId => {
            attendanceStatus[classId] = records.some(record => {
                const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
                return record.classId === classId && recordDate === today;
            });
        });
        
        return attendanceStatus;
    } catch (error) {
        console.error('Error getting attendance status for classes:', error);
        return {};
    }
};

// QR Code Management Functions
export const generateQRCode = (classId: string): string => {
    // Generate a unique QR code string with timestamp and random component
    const timestamp = Date.now();
    const randomComponent = Math.random().toString(36).substring(2, 15);
    return `${classId}-${timestamp}-${randomComponent}`;
};

export const generateQRCodeForClass = async (classId: string): Promise<{ qrCode: string; expiresAt: number }> => {
    const qrCode = generateQRCode(classId);
    const generatedAt = Date.now();
    const expiresAt = generatedAt + (10 * 60 * 1000); // 10 minutes from now
    
    try {
        // First, verify the class exists and get current data
        const classDocRef = doc(db, 'classes', classId);
        const classDoc = await getDoc(classDocRef);
        
        if (!classDoc.exists()) {
            throw new Error(`Class with ID ${classId} not found`);
        }
        
        // Update the class document with QR code information
        await updateDoc(classDocRef, {
            qrCode,
            qrCodeGeneratedAt: generatedAt,
            qrCodeExpiresAt: expiresAt
        });
        
        console.log(`QR code generated successfully for class ${classId}`);
        return { qrCode, expiresAt };
    } catch (error) {
        console.error('Error updating class with QR code:', error);
        console.error('Class ID:', classId);
        console.error('Error details:', error);
        throw error;
    }
};

export const isQRCodeValid = (classItem: Class): boolean => {
    if (!classItem.qrCode || !classItem.qrCodeExpiresAt) {
        return false;
    }
    
    const now = Date.now();
    return now < classItem.qrCodeExpiresAt;
};

export const getQRCodeTimeRemaining = (classItem: Class): number => {
    if (!classItem.qrCodeExpiresAt) {
        return 0;
    }
    
    const now = Date.now();
    const remaining = classItem.qrCodeExpiresAt - now;
    return Math.max(0, remaining);
};

export const formatTimeRemaining = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Calculate attendance statistics for a student
export const calculateStudentAttendanceStats = async (studentId: string): Promise<{
    attendanceRate: number;
    totalClasses: number;
    attendedClasses: number;
    missedClasses: number;
}> => {
    try {
        const { records, studentClasses } = await getCorrectStudentAttendanceRecords(studentId);
        
        const totalClasses = studentClasses.length;
        const attendedClasses = records.length;
        const missedClasses = totalClasses - attendedClasses;
        const attendanceRate = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;
        
        return {
            attendanceRate,
            totalClasses,
            attendedClasses,
            missedClasses
        };
    } catch (error) {
        console.error('Error calculating student attendance stats:', error);
        return {
            attendanceRate: 0,
            totalClasses: 0,
            attendedClasses: 0,
            missedClasses: 0
        };
    }
};
