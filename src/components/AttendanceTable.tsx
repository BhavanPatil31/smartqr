import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AttendanceRecord } from "@/lib/data";
import { format } from 'date-fns';

interface AttendanceTableProps {
    initialRecords: AttendanceRecord[];
}

export function AttendanceTable({ initialRecords }: AttendanceTableProps) {
    const attendanceRecords = initialRecords;

    return (
        <div className="rounded-lg border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>USN</TableHead>
                        <TableHead>Time Marked</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {attendanceRecords.length > 0 ? (
                        attendanceRecords.map((record) => (
                            <TableRow key={record.studentId}>
                                <TableCell className="font-medium">{record.name}</TableCell>
                                <TableCell>{record.usn}</TableCell>
                                <TableCell>{format(new Date(record.timestamp), 'HH:mm:ss')}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center">No students have marked attendance yet.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
