import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmployeeForm } from "@/components/employees/employee-form";

export const metadata: Metadata = { title: "Add Employee" };

export default async function NewEmployeePage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/employees");

  const departments = await prisma.department.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <Button variant="ghost" size="sm" asChild className="w-fit -ml-2">
        <Link href="/employees">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Employees
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold">Add New Employee</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Create a new employee profile and account
        </p>
      </div>

      <EmployeeForm departments={departments} />
    </div>
  );
}
