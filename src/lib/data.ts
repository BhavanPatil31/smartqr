
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

// New function to get all attendance records for a student
export const getAllStudentAttendanceRecords = async (studentId: string, department: string, semester: string): Promise<AttendanceRecord[]> => {
    const studentClasses = await getStudentClasses(department, semester);
    if (studentClasses.length === 0) {
        return [];
    }
    
    const allRecords: AttendanceRecord[] = [];

    // Firestore allows up to 30 'in' query values. We might need to batch this for students in many classes.
    // For this app's scale, we assume it's under 30.
    const classIds = studentClasses.map(c => c.id);
    
    const recordsQuery = query(
        collectionGroup(db, 'records'),
        where('studentId', '==', studentId),
        where('classId', 'in', classIds) // We need to add classId to the record
    );

    // This is a temporary workaround. The proper fix is to add classId to the attendance record and use the query above.
    // For now, let's iterate to avoid permission issues if the above query fails due to rules.
    const studentProfile = await getDoc(doc(db, 'students', studentId));
    if(!studentProfile.exists()) return [];

    const studentData = studentProfile.data();

    const attendancePromises = studentClasses.map(async (cls) => {
        const attendanceQuery = query(collectionGroup(db, 'records'), where('studentId', '==', studentId));
        // This is inefficient. We need to scope it per class.
        // The permission issue is likely because the collectionGroup query is too broad.
        // Let's query each class's attendance subcollection directly.

        const allDatesSubcollectionRef = collection(db, 'classes', cls.id, 'attendance');
        const datesSnapshot = await getDocs(allDatesSubcollectionRef);
        
        for (const dateDoc of datesSnapshot.docs) {
             const recordRef = doc(db, 'classes', cls.id, 'attendance', dateDoc.id, 'records', studentId);
             const recordSnap = await getDoc(recordRef);
             if (recordSnap.exists()) {
                 allRecords.push(recordSnap.data() as AttendanceRecord);
             }
        }
    });

    await Promise.all(attendancePromises);

    return allRecords;
}

// Corrected function to be used instead
export const getCorrectStudentAttendanceRecords = async (studentId: string, department: string, semester: string): Promise<AttendanceRecord[]> => {
    const studentClasses = await getStudentClasses(department, semester);
    if (studentClasses.length === 0) return [];
    
    let allRecords: AttendanceRecord[] = [];

    for (const cls of studentClasses) {
        const attendanceCollectionGroup = collectionGroup(db, 'records');
        const q = query(attendanceCollectionGroup, where('studentId', '==', studentId));
        
        // This is still too broad. The issue is that collectionGroup queries are hard to secure.
        // The most robust way is to query each class's attendance collection.
        // This might be slower but it's guaranteed to work with our rules.
        
        const attendanceSubCollectionRef = collection(db, 'classes', cls.id, 'attendance');
        const dateDocs = await getDocs(attendanceSubCollectionRef);

        for (const dateDoc of dateDocs.docs) {
            const recordsRef = collection(db, 'classes', cls.id, 'attendance', dateDoc.id, 'records');
            const studentRecordQuery = query(recordsRef, where('studentId', '==', studentId));
            const studentRecordsSnapshot = await getDocs(studentRecordQuery);
            studentRecordsSnapshot.forEach(recordDoc => {
                allRecords.push(recordDoc.data() as AttendanceRecord);
            });
        }
    }

    return allRecords;
};
