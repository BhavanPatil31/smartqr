
import { collection, getDocs, getDoc, doc, query, where, collectionGroup } from 'firebase/firestore';
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
}

export interface AttendanceRecord {
    studentId: string;
    studentName: string;
    usn: string;
    timestamp: number;
    deviceInfo: string;
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
    const q = query(collection(db, 'classes'), where('teacherId', '==', teacherId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));
};

export const getClassById = async (classId: string): Promise<Class | null> => {
    const docRef = doc(db, 'classes', classId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Class;
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
    const q = query(collection(db, 'classes'), where('department', '==', department));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));
}

export const getTeachersByDepartment = async (department: string) => {
    const q = query(collection(db, 'teachers'), where('department', '==', department));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeacherProfile));
}

export const getStudentsByDepartment = async (department: string) => {
    const q = query(collection(db, 'students'), where('department', '==', department));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentProfile));
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

    const studentClasses = await getStudentClasses(department, semester);
    if (studentClasses.length === 0) return { records: [], studentClasses: [] };

    let allRecords: AttendanceRecord[] = [];

    // This query is more efficient than iterating through every class
    const recordsQuery = query(
        collectionGroup(db, 'records'),
        where('studentId', '==', studentId)
    );
    const recordsSnapshot = await getDocs(recordsQuery);
    
    recordsSnapshot.forEach(recordDoc => {
        allRecords.push(recordDoc.data() as AttendanceRecord);
    });

    return { records: allRecords, studentClasses };
};
