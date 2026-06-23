"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");
  return session;
}

export async function upsertDepartment(data: {
  id?: string;
  name: string;
  description?: string;
}) {
  try {
    const session = await requireAdmin();

    const dept = data.id
      ? await prisma.department.update({
          where: { id: data.id },
          data: { name: data.name, description: data.description ?? null },
        })
      : await prisma.department.create({
          data: { name: data.name, description: data.description ?? null },
        });

    await logActivity({
      userId: session.user.id,
      action: data.id ? "EMPLOYEE_UPDATED" : "EMPLOYEE_CREATED",
      entityType: "Department",
      entityId: dept.id,
      description: `${data.id ? "Updated" : "Created"} department: ${dept.name}`,
    });

    revalidatePath("/settings");
    return { success: true, data: dept };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteDepartment(id: string) {
  try {
    const session = await requireAdmin();

    const dept = await prisma.department.update({
      where: { id },
      data: { isActive: false },
    });

    await logActivity({
      userId: session.user.id,
      action: "EMPLOYEE_UPDATED",
      entityType: "Department",
      entityId: dept.id,
      description: `Deactivated department: ${dept.name}`,
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function upsertEventCategory(data: {
  id?: string;
  name: string;
  color: string;
  description?: string;
}) {
  try {
    const session = await requireAdmin();

    const cat = data.id
      ? await prisma.eventCategory.update({
          where: { id: data.id },
          data: {
            name: data.name,
            color: data.color,
            description: data.description ?? null,
          },
        })
      : await prisma.eventCategory.create({
          data: {
            name: data.name,
            color: data.color,
            description: data.description ?? null,
          },
        });

    await logActivity({
      userId: session.user.id,
      action: data.id ? "EVENT_UPDATED" : "EVENT_CREATED",
      entityType: "EventCategory",
      entityId: cat.id,
      description: `${data.id ? "Updated" : "Created"} event category: ${cat.name}`,
    });

    revalidatePath("/settings");
    return { success: true, data: cat };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteEventCategory(id: string) {
  try {
    const session = await requireAdmin();

    const cat = await prisma.eventCategory.update({
      where: { id },
      data: { isActive: false },
    });

    await logActivity({
      userId: session.user.id,
      action: "EVENT_UPDATED",
      entityType: "EventCategory",
      entityId: cat.id,
      description: `Deactivated event category: ${cat.name}`,
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
