import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <nav className="border-b px-6 py-4 flex gap-6">
        <Link href="/employees" className="font-semibold">Perkins</Link>
        <Link href="/employees">Employees</Link>
        <Link href="/reports">Reports</Link>
        <Link href="/ask">Ask</Link>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  );
}
