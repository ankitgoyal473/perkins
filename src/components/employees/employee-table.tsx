import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { EmployeeListItem } from "@/app/(dashboard)/employees/actions";

export function EmployeeTable({ employees }: { employees: EmployeeListItem[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Country</TableHead>
          <TableHead>Level</TableHead>
          <TableHead className="text-right">Current Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map((e) => (
          <TableRow key={e.id}>
            <TableCell>
              <Link href={`/employees/${e.id}`} className="underline">{e.name}</Link>
            </TableCell>
            <TableCell>{e.department}</TableCell>
            <TableCell>{e.country}</TableCell>
            <TableCell>{e.jobLevel}</TableCell>
            <TableCell className="text-right">{e.currentTotal.toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
