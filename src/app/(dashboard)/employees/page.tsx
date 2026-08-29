import { listEmployees } from "./actions";
import { EmployeeTable } from "@/components/employees/employee-table";
import { EmployeeFilters } from "@/components/employees/employee-filters";

const PAGE_SIZE = 25;

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; department?: string; country?: string; jobLevel?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");

  const { employees, total } = await listEmployees({
    page,
    pageSize: PAGE_SIZE,
    department: params.department,
    country: params.country,
    jobLevel: params.jobLevel,
    search: params.search,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Employees ({total})</h1>
      <EmployeeFilters />
      <EmployeeTable employees={employees} />
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </p>
    </div>
  );
}
