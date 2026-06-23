"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import type { ActionResult } from "@/types";
import { sendPasswordResetEmail } from "@/lib/email";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number")
    .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export async function changePassword(
  formData: z.infer<typeof changePasswordSchema>
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const parsed = changePasswordSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.passwordHash) return { success: false, error: "User not found" };

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: { currentPassword: ["Current password is incorrect"] },
    };
  }

  const sameAsOld = await bcrypt.compare(newPassword, user.passwordHash);
  if (sameAsOld) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: { newPassword: ["New password must be different from current password"] },
    };
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hash },
  });

  await logActivity({
    action: "USER_LOGOUT",
    entityType: "User",
    entityId: user.id,
    description: "Password changed",
    userId: session.user.id,
  });

  revalidatePath("/profile");
  return { success: true };
}

export async function setEmployeeRole(
  employeeId: string,
  role: "ADMIN" | "EMPLOYEE"
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { user: true },
  });

  if (!employee?.user) return { success: false, error: "Employee not found" };

  // Prevent admins from demoting themselves
  if (employee.user.id === session.user.id && role === "EMPLOYEE") {
    return { success: false, error: "You cannot remove your own admin role" };
  }

  await prisma.user.update({
    where: { id: employee.user.id },
    data: { role },
  });

  await logActivity({
    action: "EMPLOYEE_UPDATED",
    entityType: "Employee",
    entityId: employeeId,
    description: `${employee.firstName} ${employee.lastName} role changed to ${role}`,
    userId: session.user.id,
  });

  revalidatePath(`/employees/${employeeId}`);
  return { success: true };
}

export async function resetEmployeePassword(
  employeeId: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { user: true },
  });

  if (!employee?.user) return { success: false, error: "Employee not found" };

  const hash = await bcrypt.hash("TempPass@123!", 10);
  await prisma.user.update({
    where: { id: employee.user.id },
    data: { passwordHash: hash },
  });

  await logActivity({
    action: "EMPLOYEE_UPDATED",
    entityType: "Employee",
    entityId: employeeId,
    description: `Password reset for ${employee.firstName} ${employee.lastName}`,
    userId: session.user.id,
  });

  sendPasswordResetEmail(
    employee.user.email,
    `${employee.firstName} ${employee.lastName}`
  ).catch((err) => console.error("Failed to send password reset email:", err));

  return { success: true };
}
