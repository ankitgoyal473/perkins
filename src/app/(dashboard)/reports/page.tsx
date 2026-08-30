import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  payByDepartment,
  payByCountry,
  payByLevel,
  compTrend,
  type GroupPayStat,
  type CountryPayStat,
  type CompTrendPoint,
} from "./actions";

// No searchParams/cookies/headers here, so Next would otherwise treat this
// as static and bake in a build-time snapshot of live salary data forever.
export const dynamic = "force-dynamic";

function money(n: number) {
  return Math.round(n).toLocaleString();
}

function GroupTable({
  label,
  rows,
}: {
  label: string;
  rows: GroupPayStat[];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{label}</TableHead>
          <TableHead className="text-right">Headcount</TableHead>
          <TableHead className="text-right">Average Pay</TableHead>
          <TableHead className="text-right">Median Pay</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.group}>
            <TableCell>{r.group}</TableCell>
            <TableCell className="text-right">{r.headcount}</TableCell>
            <TableCell className="text-right">{money(r.avgTotal)}</TableCell>
            <TableCell className="text-right">{money(r.medianTotal)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function CountryTable({ rows }: { rows: CountryPayStat[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Country</TableHead>
          <TableHead className="text-right">Headcount</TableHead>
          <TableHead className="text-right">Average Pay</TableHead>
          <TableHead className="text-right">Median Pay</TableHead>
          <TableHead className="text-right">Headcount Cost</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.group}>
            <TableCell>{r.group}</TableCell>
            <TableCell className="text-right">{r.headcount}</TableCell>
            <TableCell className="text-right">{money(r.avgTotal)}</TableCell>
            <TableCell className="text-right">{money(r.medianTotal)}</TableCell>
            <TableCell className="text-right">{money(r.totalCost)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function TrendTable({ rows }: { rows: CompTrendPoint[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Year</TableHead>
          <TableHead className="text-right">Average Amount</TableHead>
          <TableHead className="text-right">Records</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.year}>
            <TableCell>{r.year}</TableCell>
            <TableCell className="text-right">{money(r.avgAmount)}</TableCell>
            <TableCell className="text-right">{r.recordCount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default async function ReportsPage() {
  const [department, country, level, trend] = await Promise.all([
    payByDepartment(),
    payByCountry(),
    payByLevel(),
    compTrend(),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Reports</h1>

      <Card>
        <CardHeader>
          <CardTitle>Pay by Department</CardTitle>
        </CardHeader>
        <CardContent>
          <GroupTable label="Department" rows={department} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pay & Headcount Cost by Country</CardTitle>
        </CardHeader>
        <CardContent>
          <CountryTable rows={country} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pay by Level</CardTitle>
        </CardHeader>
        <CardContent>
          <GroupTable label="Level" rows={level} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compensation Trend Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendTable rows={trend} />
        </CardContent>
      </Card>
    </div>
  );
}
