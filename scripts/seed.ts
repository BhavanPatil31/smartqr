
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import admin, { ServiceAccount } from 'firebase-admin';

interface SeedStudent {
    id: string;
    fullName: string;
    usn: string;
    email: string;
    phoneNumber: string;
    semester: string;
    department: string;
}

interface SeedClass {
    id: string;
    subject: string;
    semester: string;
    department: string;
    teacherId: string;
    teacherName: string;
    schedules: Array<{ day: string; startTime: string; endTime: string; roomNumber: string }>;
    maxStudents?: number;
}

function loadServiceAccount(): ServiceAccount {
    const base64 = process.env.FIREBASE_ADMIN_CREDENTIALS_BASE64;
    const filePath = process.env.FIREBASE_ADMIN_CREDENTIALS;

    if (base64) {
        return JSON.parse(Buffer.from(base64, 'base64').toString('utf8')) as ServiceAccount;
    }

    if (filePath) {
        const abs = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
        const raw = fs.readFileSync(abs, 'utf8');
        return JSON.parse(raw) as ServiceAccount;
    }

    throw new Error('Missing FIREBASE_ADMIN_CREDENTIALS or FIREBASE_ADMIN_CREDENTIALS_BASE64');
}

async function initializeAdmin(): Promise<admin.app.App> {
    if (admin.apps.length) return admin.app();
    const cred = loadServiceAccount();
    return admin.initializeApp({ credential: admin.credential.cert(cred) });
}

async function upsert<T>(ref: FirebaseFirestore.DocumentReference<T>, data: T): Promise<void> {
    const snap = await ref.get();
    if (snap.exists) {
        await ref.set({ ...(snap.data() as T), ...data } as T, { merge: true });
    } else {
        await ref.set(data);
    }
}

async function seed(): Promise<void> {
    const app = await initializeAdmin();
    const db = admin.firestore(app);

    const SEED_STUDENT_UID = process.env.SEED_STUDENT_UID || 'stu_001';
    const SEED_STUDENT_NAME = process.env.SEED_STUDENT_NAME || 'Bhavan P';
    const SEED_STUDENT_USN = process.env.SEED_STUDENT_USN || 'USN001';
    const SEED_DEPT = process.env.SEED_DEPT || 'CSE';
    const SEED_SEM = process.env.SEED_SEM || '5';

    // ----- Define your seed data here (customize as needed) -----
    const students: SeedStudent[] = [
        {
            id: SEED_STUDENT_UID,
            fullName: SEED_STUDENT_NAME,
            usn: SEED_STUDENT_USN,
            email: 'bhavan@example.com',
            phoneNumber: '9999999999',
            semester: SEED_SEM,
            department: SEED_DEPT
        },
        {
            id: 'stu_002',
            fullName: 'Asha K',
            usn: 'USN002',
            email: 'asha@example.com',
            phoneNumber: '8888888888',
            semester: SEED_SEM,
            department: SEED_DEPT
        }
    ];

    const classes: SeedClass[] = [
        {
            id: 'cls_dsa',
            subject: 'Data Structures',
            semester: SEED_SEM,
            department: SEED_DEPT,
            teacherId: 't_001',
            teacherName: 'Prof. Rao',
            schedules: [
                { day: 'Monday', startTime: '10:00', endTime: '11:00', roomNumber: 'A101' },
                { day: 'Wednesday', startTime: '10:00', endTime: '11:00', roomNumber: 'A101' }
            ],
            maxStudents: 60
        },
        {
            id: 'cls_dbms',
            subject: 'DBMS',
            semester: SEED_SEM,
            department: SEED_DEPT,
            teacherId: 't_002',
            teacherName: 'Prof. Mehta',
            schedules: [
                { day: 'Tuesday', startTime: '09:00', endTime: '10:00', roomNumber: 'B201' },
                { day: 'Thursday', startTime: '09:00', endTime: '10:00', roomNumber: 'B201' }
            ],
            maxStudents: 60
        }
    ];

    // ----- Seed students -----
    for (const s of students) {
        await upsert(db.collection('students').doc(s.id), s);
    }

    // ----- Seed classes -----
    for (const c of classes) {
        await upsert(db.collection('classes').doc(c.id), c);
    }

    const makeDateId = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);
    const recentDays: Date[] = [
        new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        new Date(Date.now() - 1000 * 60 * 60 * 24 * 1)
    ];

    for (const c of classes) {
        for (const day of recentDays) {
            const dateId = makeDateId(day);
            const attendanceColl = db.collection('classes').doc(c.id).collection('attendance').doc(dateId).collection('records');

            // Always create records for the primary student UID so permissions match the logged-in user
            const recordPrimary = {
                studentId: SEED_STUDENT_UID,
                studentName: SEED_STUDENT_NAME,
                usn: SEED_STUDENT_USN,
                timestamp: Date.now(),
                deviceInfo: 'seed-script',
                classId: c.id,
                subject: c.subject
            };
            await attendanceColl.add(recordPrimary);

            // Add one more sample student on the second day
            if (day.getTime() === recentDays[1].getTime()) {
                const recordOther = {
                    studentId: 'stu_002',
                    studentName: 'Asha K',
                    usn: 'USN002',
                    timestamp: Date.now(),
                    deviceInfo: 'seed-script',
                    classId: c.id,
                    subject: c.subject
                };
                await attendanceColl.add(recordOther);
            }
        }
    }

    const adminId = process.env.SEED_ADMIN_UID || 'admin_001';

    // ----- Seed admin profile -----
    await upsert(db.collection('admins').doc(adminId), {
        fullName: 'Admin User',
        email: 'admin@example.com',
        department: SEED_DEPT
    });

    // ----- Seed pending teachers -----
    const pendingTeachers = [
        { id: 't_001', fullName: 'Prof. Rao', email: 'rao@example.com', phoneNumber: '7777777777', department: SEED_DEPT, isApproved: false, isApprovalRequested: true, registeredAt: Date.now() },
        { id: 't_002', fullName: 'Prof. Mehta', email: 'mehta@example.com', phoneNumber: '6666666666', department: SEED_DEPT, isApproved: false, isApprovalRequested: true, registeredAt: Date.now() }
    ];
    for (const t of pendingTeachers) {
        await upsert(db.collection('teachers').doc(t.id), t as any);
    }

    console.log('✅ Seed complete for student UID:', SEED_STUDENT_UID);
}

seed()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Seed failed:', err);
        process.exit(1);
    });
