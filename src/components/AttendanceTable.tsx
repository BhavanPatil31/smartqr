import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AttendanceRecord } from "@/lib/data";
import { format } from 'date-fns-tz';

interface AttendanceTableProps {
    records: AttendanceRecord[];
}

export function AttendanceTable({ records }: AttendanceTableProps) {
    // Sort records by timestamp in descending order (newest first)
    const sortedRecords = [...records].sort((a, b) => b.timestamp - a.timestamp);

    return (
        <div className="rounded-lg border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>USN</TableHead>
                        <TableHead>Time Marked (IST)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedRecords.length > 0 ? (
                        sortedRecords.map((record) => (
                            <TableRow key={record.studentId}>
                                <TableCell className="font-medium">{record.studentName}</TableCell>
                                <TableCell>{record.usn}</TableCell>
                                <TableCell>{format(new Date(record.timestamp), 'hh:mm:ss a', { timeZone: 'Asia/Kolkata' })}</TableCell>
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
