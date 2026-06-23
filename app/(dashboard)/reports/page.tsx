import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ReportsDashboard } from "@/components/reports/reports-dashboard";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Reports" };

async function ReportsContent() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const [employees, events, categories, departments] = await Promise.all([
    prisma.employee.findMany({
      where: { isActive: true },
      include: {
        department: { select: { name: true } },
        _count: { select: { assignments: true, attendance: true } },
      },
      orderBy: { eventsAttended: "desc" },
    }),
    prisma.event.findMany({
      include: {
        category: { select: { name: true, color: true } },
        _count: { select: { assignments: true, attendance: true } },
      },
      orderBy: { date: "desc" },
    }),
    prisma.eventCategory.findMany({ where: { isActive: true } }),
    prisma.department.findMany({ where: { isActive: true } }),
  ]);

  return (
    <ReportsDashboard
      employees={employees}
      events={events}
      categories={categories}
      departments={departments}
    />
  );
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-40" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        </div>
      }
    >
      <ReportsContent />
    </Suspense>
  );
}
