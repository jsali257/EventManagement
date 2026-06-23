import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EmployeeProfile } from "@/components/employees/employee-profile";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const employee = await prisma.employee.findUnique({
    where: { id },
    select: { firstName: true, lastName: true },
  });
  if (!employee) return { title: "Not Found" };
  return { title: `${employee.firstName} ${employee.lastName}` };
}

async function EmployeeProfileContent({ id }: { id: string }) {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      department: true,
      user: { select: { role: true } },
      assignments: {
        include: {
          event: {
            include: {
              category: { select: { name: true, color: true } },
            },
          },
        },
        orderBy: { event: { date: "desc" } },
        take: 10,
      },
      attendance: {
        include: {
          event: { select: { title: true, date: true } },
        },
        orderBy: { event: { date: "desc" } },
        take: 10,
      },
      availability: {
        where: { date: { gte: new Date() } },
        orderBy: { date: "asc" },
        take: 30,
      },
    },
  });

  if (!employee) notFound();

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const upcomingAssignments = employee.assignments.filter(
    (a) => new Date(a.event.date) >= now
  );

  return (
    <EmployeeProfile
      employee={employee}
      upcomingAssignments={upcomingAssignments}
      isAdmin={isAdmin}
      isOwnProfile={session?.user?.employeeId === id}
      userRole={(employee.user?.role ?? "EMPLOYEE") as "ADMIN" | "EMPLOYEE"}
    />
  );
}

export default async function EmployeeProfilePage({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      }
    >
      <EmployeeProfileContent id={id} />
    </Suspense>
  );
}
