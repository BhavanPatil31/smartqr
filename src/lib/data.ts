import { addMinutes, set } from 'date-fns';

export interface Student {
    id: string;
    name: string;
    usn: string;
    semester: number;
    department: string;
}

export interface Teacher {
    id: string;
    name: string;
    email: string;
    department: string;
}

export interface TimeSlot {
    day: string;
    start: string; // "HH:mm"
    end: string; // "HH:mm"
}

export interface Class {
    id: string;
    subject: string;
    semester: number;
    department: string;
    teacherId: string;
    timeSlot: TimeSlot;
}

export interface AttendanceRecord {
    studentId: string;
    name: string;
    usn: string;
    timestamp: number;
    deviceInfo: string;
}

// MOCK DATA

const students: Student[] = [
    { id: 'S1', name: 'Alice Johnson', usn: '1AB21CS001', semester: 5, department: 'Computer Science' },
    { id: 'S2', name: 'Bob Williams', usn: '1AB21CS002', semester: 5, department: 'Computer Science' },
    { id: 'S3', name: 'Charlie Brown', usn: '1AB21CS003', semester: 5, department: 'Computer Science' },
    { id: 'S4', name: 'Diana Miller', usn: '1AB21EC001', semester: 5, department: 'Electronics' },
];

const teachers: Teacher[] = [
    { id: 'T1', name: 'Dr. Evelyn Reed', email: 'e.reed@example.com', department: 'Computer Science' },
    { id: 'T2', name: 'Prof. Alan Grant', email: 'a.grant@example.com', department: 'Electronics' },
];

const now = new Date();
const classStartTime = set(now, { minutes: now.getMinutes() - 30 });
const classEndTime = addMinutes(classStartTime, 90);

const classes: Class[] = [
    { 
        id: 'C1', 
        subject: 'Database Systems', 
        semester: 5, 
        department: 'Computer Science', 
        teacherId: 'T1', 
        timeSlot: { 
            day: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()], 
            start: `${classStartTime.getHours().toString().padStart(2, '0')}:${classStartTime.getMinutes().toString().padStart(2, '0')}`,
            end: `${classEndTime.getHours().toString().padStart(2, '0')}:${classEndTime.getMinutes().toString().padStart(2, '0')}`
        } 
    },
    { id: 'C2', subject: 'Digital Circuits', semester: 5, department: 'Electronics', teacherId: 'T2', timeSlot: { day: 'Wednesday', start: '11:00', end: '12:30' } },
    { id: 'C3', subject: 'Operating Systems', semester: 5, department: 'Computer Science', teacherId: 'T1', timeSlot: { day: 'Friday', start: '09:00', end: '10:30' } },
];

// Mocking some attendance data for today
const todayStr = now.toISOString().split('T')[0]; // "yyyy-MM-dd"
const classTime = addMinutes(classStartTime, 15).getTime();
const attendance: Record<string, Record<string, AttendanceRecord[]>> = {
    'C1': {
        [todayStr]: [
            { studentId: 'S1', name: 'Alice Johnson', usn: '1AB21CS001', timestamp: classTime, deviceInfo: 'device_A' },
            { studentId: 'S2', name: 'Bob Williams', usn: '1AB21CS002', timestamp: addMinutes(classTime, 1).getTime(), deviceInfo: 'device_B' },
            // Suspicious entries
            { studentId: 'S3', name: 'Charlie Brown', usn: '1AB21CS003', timestamp: addMinutes(classTime, 2).getTime(), deviceInfo: 'device_C_suspicious' },
            { studentId: 'S4', name: 'David Smith (Proxy)', usn: '1AB21CS004', timestamp: addMinutes(classTime, 2).getTime(), deviceInfo: 'device_C_suspicious' },
            { studentId: 'S5', name: 'Eve Davis (Proxy)', usn: '1AB21CS005', timestamp: addMinutes(classTime, 2).getTime(), deviceInfo: 'device_C_suspicious' },
             { studentId: 'S6', name: 'Frank White (Proxy)', usn: '1AB21CS006', timestamp: addMinutes(classTime, 2).getTime(), deviceInfo: 'device_C_suspicious' },
        ],
    },
};

// DATA ACCESS FUNCTIONS

export const getStudentClasses = () => {
    return classes.filter(c => c.department === 'Computer Science' || c.department === 'Electronics');
};

export const getTeacherClasses = (teacherId: string) => {
    return classes.filter(c => c.teacherId === teacherId);
};

export const getClassById = (classId: string) => {
    return classes.find(c => c.id === classId);
};

export const getTeacherById = (teacherId: string) => {
    return teachers.find(t => t.id === teacherId);
};

export const getAttendanceForClassOnDate = (classId: string, date: string): AttendanceRecord[] => {
    return attendance[classId]?.[date] || [];
};
