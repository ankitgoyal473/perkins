import { notFound } from "next/navigation";
import { getEmployeeDetail } from "./actions";
import { SalaryHistory } from "@/components/employees/salary-history";
import { SalaryForm } from "@/components/employees/salary-form";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const employee = await getEmployeeDetail(id);
  if (!employee) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{employee.name}</h1>
        <p className="text-muted-foreground">
          {employee.department} · {employee.jobLevel} · {employee.country}
        </p>
      </div>
      <SalaryForm employeeId={employee.id} />
      <SalaryHistory history={employee.salaryHistory} />
    </div>
  );
}
