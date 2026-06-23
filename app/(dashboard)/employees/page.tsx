import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Plus, UserX } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmployeeGrid } from "@/components/employees/employee-grid";
import { EmployeeFilters } from "@/components/employees/employee-filters";

export const metadata: Metadata = { title: "Employees" };

interface SearchParams {
  department?: string;
  status?: string;
  search?: string;
  sort?: string;
  page?: string;
  inactive?: string;
}

async function EmployeesContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const page = parseInt(params.page ?? "1");
  const pageSize = 24;
  const showInactive = params.inactive === "true";

  const where = {
    isActive: showInactive ? false : true,
    ...(params.department && { departmentId: params.department }),
    ...(!showInactive && params.status && { status: params.status as never }),
    ...(params.search && {
      OR: [
        { firstName: { contains: params.search, mode: "insensitive" as const } },
        { lastName: { contains: params.search, mode: "insensitive" as const } },
        { employeeId: { contains: params.search, mode: "insensitive" as const } },
        { jobTitle: { contains: params.search, mode: "insensitive" as const } },
      ],
    }),
  };

  const orderBy = (() => {
    switch (params.sort) {
      case "events-asc": return { eventsAttended: "asc" as const };
      case "events-desc": return { eventsAttended: "desc" as const };
      case "hours-desc": return { volunteerHours: "desc" as const };
      case "attendance": return { attendanceRate: "desc" as const };
      case "score": return { volunteerScore: "desc" as const };
      default: return { lastName: "asc" as const };
    }
  })();

  const [employees, total, departments] = await Promise.all([
    prisma.employee.findMany({
      where,
      include: {
        department: { select: { id: true, name: true, color: true } },
        _count: { select: { assignments: true } },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.employee.count({ where }),
    prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {showInactive ? "Inactive Employees" : "Employees"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {total} {showInactive ? "inactive" : ""} employee{total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant={showInactive ? "default" : "outline"} asChild>
              <Link href={showInactive ? "/employees" : "/employees?inactive=true"}>
                <UserX className="mr-2 h-4 w-4" />
                {showInactive ? "View Active" : "View Inactive"}
              </Link>
            </Button>
          )}
          {isAdmin && !showInactive && (
            <Button asChild>
              <Link href="/employees/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Employee
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <EmployeeFilters departments={departments} showInactive={showInactive} />

      {/* Employee Grid */}
      <EmployeeGrid
        employees={employees}
        total={total}
        page={page}
        pageSize={pageSize}
        isAdmin={isAdmin}
        showInactive={showInactive}
      />
    </div>
  );
}

export default function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <Suspense
      fallback={
        <div className="p-6">
          <Skeleton className="h-8 w-40 mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        </div>
      }
    >
      <EmployeesContent searchParams={searchParams} />
    </Suspense>
  );
}
