"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types";

export async function markNotificationRead(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  try {
    await prisma.notification.update({
      where: { id, userId: session.user.id },
      data: { isRead: true, readAt: new Date() },
    });
    revalidatePath("/notifications");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to mark as read" };
  }
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  try {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    revalidatePath("/notifications");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to mark all as read" };
  }
}

export async function deleteNotification(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  try {
    await prisma.notification.delete({
      where: { id, userId: session.user.id },
    });
    revalidatePath("/notifications");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete notification" };
  }
}
