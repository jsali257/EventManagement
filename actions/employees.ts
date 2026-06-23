"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import bcrypt from "bcryptjs";
import type { ActionResult } from "@/types";
import { sendWelcomeEmail } from "@/lib/email";

const employeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  jobTitle: z.string().min(1, "Job title is required"),
  departmentId: z.string().min(1, "Department is required"),
  status: z.enum(["AVAILABLE", "BUSY", "VACATION", "SICK", "TRAINING", "INACTIVE"]),
  avatarColor: z.string().default("#3B82F6"),
  notes: z.string().optional(),
});

const availabilitySchema = z.object({
  employeeId: z.string(),
  date: z.string(),
  isUnavailable: z.boolean(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export async function createEmployee(
  formData: z.infer<typeof employeeSchema>
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = employeeSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;

  try {
    // Check for duplicate email — employee record is the definitive check
    const existingEmployee = await prisma.employee.findFirst({
      where: { email: data.email },
    });
    if (existingEmployee) {
      return { success: false, error: "An employee with this email already exists" };
    }

    // Auto-generate employee ID
    const count = await prisma.employee.count();
    const employeeId = `EMP${String(count + 1).padStart(3, "0")}`;

    // Reuse an existing user account if one already exists (e.g. from a failed prior attempt),
    // otherwise create a fresh one.
    const tempPassword = await bcrypt.hash("TempPass@123!", 10);
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    const user = existingUser
      ? await prisma.user.update({
          where: { email: data.email },
          data: {
            name: `${data.firstName} ${data.lastName}`,
            role: "EMPLOYEE",
            isActive: true,
          },
        })
      : await prisma.user.create({
          data: {
            email: data.email,
            name: `${data.firstName} ${data.lastName}`,
            passwordHash: tempPassword,
            role: "EMPLOYEE",
            isActive: true,
          },
        });

    const employee = await prisma.employee.create({
      data: {
        employeeId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        jobTitle: data.jobTitle,
        departmentId: data.departmentId,
        status: data.status,
        avatarColor: data.avatarColor,
        notes: data.notes,
        userId: user.id,
      },
    });

    // Link user to employee
    await prisma.user.update({
      where: { id: user.id },
      data: {},
    });

    await logActivity({
      action: "EMPLOYEE_CREATED",
      entityType: "Employee",
      entityId: employee.id,
      description: `Employee ${data.firstName} ${data.lastName} (${employeeId}) created`,
      userId: session.user.id,
    });

    // Send welcome email — fire and forget, don't block creation if email fails
    sendWelcomeEmail(data.email, `${data.firstName} ${data.lastName}`).catch((err) =>
      console.error("Failed to send welcome email:", err)
    );

    revalidatePath("/employees");
    revalidatePath("/dashboard");

    return { success: true, data: { id: employee.id } };
  } catch (error) {
    console.error("Failed to create employee:", error);
    return { success: false, error: "Failed to create employee" };
  }
}

export async function updateEmployee(
  id: string,
  formData: Partial<z.infer<typeof employeeSchema>>
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) return { success: false, error: "Employee not found" };

    await prisma.employee.update({
      where: { id },
      data: {
        ...(formData.firstName && { firstName: formData.firstName }),
        ...(formData.lastName && { lastName: formData.lastName }),
        ...(formData.phone !== undefined && { phone: formData.phone }),
        ...(formData.jobTitle && { jobTitle: formData.jobTitle }),
        ...(formData.departmentId && { departmentId: formData.departmentId }),
        ...(formData.status && { status: formData.status }),
        ...(formData.avatarColor && { avatarColor: formData.avatarColor }),
        ...(formData.notes !== undefined && { notes: formData.notes }),
      },
    });

    // Sync name to user
    if (formData.firstName || formData.lastName) {
      if (employee.userId) {
        const emp = await prisma.employee.findUnique({ where: { id } });
        await prisma.user.update({
          where: { id: employee.userId },
          data: {
            name: `${emp?.firstName ?? ""} ${emp?.lastName ?? ""}`.trim(),
          },
        });
      }
    }

    await logActivity({
      action: "EMPLOYEE_UPDATED",
      entityType: "Employee",
      entityId: id,
      description: `Employee ${employee.firstName} ${employee.lastName} updated`,
      userId: session.user.id,
    });

    revalidatePath(`/employees/${id}`);
    revalidatePath("/employees");

    return { success: true };
  } catch (error) {
    console.error("Failed to update employee:", error);
    return { success: false, error: "Failed to update employee" };
  }
}

export async function updateEmployeeStatus(
  id: string,
  status: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.employee.update({
      where: { id },
      data: { status: status as never },
    });

    revalidatePath(`/employees/${id}`);
    revalidatePath("/employees");
    revalidatePath("/volunteer-board");

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update status" };
  }
}

export async function deactivateEmployee(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) return { success: false, error: "Employee not found" };

    await prisma.employee.update({
      where: { id },
      data: { isActive: false, status: "INACTIVE" },
    });

    if (employee.userId) {
      await prisma.user.update({
        where: { id: employee.userId },
        data: { isActive: false },
      });
    }

    await logActivity({
      action: "EMPLOYEE_DELETED",
      entityType: "Employee",
      entityId: id,
      description: `Employee ${employee.firstName} ${employee.lastName} deactivated`,
      userId: session.user.id,
    });

    revalidatePath("/employees");
    revalidatePath(`/employees/${id}`);

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to deactivate employee" };
  }
}

export async function reactivateEmployee(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) return { success: false, error: "Employee not found" };

    await prisma.employee.update({
      where: { id },
      data: { isActive: true, status: "AVAILABLE" },
    });

    if (employee.userId) {
      await prisma.user.update({
        where: { id: employee.userId },
        data: { isActive: true },
      });
    }

    await logActivity({
      action: "EMPLOYEE_UPDATED",
      entityType: "Employee",
      entityId: id,
      description: `Employee ${employee.firstName} ${employee.lastName} reactivated`,
      userId: session.user.id,
    });

    revalidatePath("/employees");
    revalidatePath(`/employees/${id}`);

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to reactivate employee" };
  }
}

export async function setEmployeeAvailability(
  data: z.infer<typeof availabilitySchema>
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  // Employees can only set their own availability unless admin
  if (
    session.user.role !== "ADMIN" &&
    session.user.employeeId !== data.employeeId
  ) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = availabilitySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Validation failed" };
  }

  try {
    const date = new Date(data.date);
    date.setHours(0, 0, 0, 0);

    await prisma.employeeAvailability.upsert({
      where: {
        employeeId_date: { employeeId: data.employeeId, date },
      },
      update: {
        isUnavailable: data.isUnavailable,
        reason: data.reason,
        notes: data.notes,
      },
      create: {
        employeeId: data.employeeId,
        date,
        isUnavailable: data.isUnavailable,
        reason: data.reason,
        notes: data.notes,
      },
    });

    await logActivity({
      action: "AVAILABILITY_SET",
      entityType: "Employee",
      entityId: data.employeeId,
      description: `Availability set for ${date.toLocaleDateString()}`,
      userId: session.user.id,
    });

    revalidatePath(`/employees/${data.employeeId}`);

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to save availability" };
  }
}

export async function removeEmployeeAvailability(
  employeeId: string,
  date: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  if (session.user.role !== "ADMIN" && session.user.employeeId !== employeeId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    await prisma.employeeAvailability.deleteMany({
      where: { employeeId, date: d },
    });

    await logActivity({
      action: "AVAILABILITY_SET",
      entityType: "Employee",
      entityId: employeeId,
      description: `Availability removed for ${d.toLocaleDateString()}`,
      userId: session.user.id,
    });

    revalidatePath(`/employees/${employeeId}`);

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to remove availability" };
  }
}

export async function uploadProfilePicture(
  employeeId: string,
  _formData: FormData
): Promise<ActionResult<{ url: string }>> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  // File upload handled separately via upload API route
  return { success: false, error: "Use the upload API endpoint" };
}
