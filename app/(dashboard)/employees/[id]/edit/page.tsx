import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmployeeForm } from "@/components/employees/employee-form";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const emp = await prisma.employee.findUnique({
    where: { id },
    select: { firstName: true, lastName: true },
  });
  return { title: emp ? `Edit: ${emp.firstName} ${emp.lastName}` : "Edit Employee" };
}

export default async function EditEmployeePage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect(`/employees/${id}`);

  const [employee, departments] = await Promise.all([
    prisma.employee.findUnique({ where: { id } }),
    prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!employee || !employee.isActive) notFound();

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <Button variant="ghost" size="sm" asChild className="w-fit -ml-2">
        <Link href={`/employees/${id}`}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Profile
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold">Edit Employee</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {employee.firstName} {employee.lastName}
        </p>
      </div>

      <EmployeeForm
        departments={departments}
        employeeId={employee.id}
        defaultValues={{
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phone: employee.phone ?? "",
          jobTitle: employee.jobTitle,
          departmentId: employee.departmentId,
          status: employee.status as any,
          avatarColor: employee.avatarColor,
          notes: employee.notes ?? "",
        }}
      />
    </div>
  );
}
