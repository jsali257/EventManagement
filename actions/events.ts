"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { sendEventAssignmentEmail } from "@/lib/email";
import {
  notifyEventUpdated,
  notifyEventCancelled,
  notifyVolunteerAssigned,
  notifyVolunteerRemoved,
} from "@/lib/notifications";
import type { ActionResult } from "@/types";

const eventSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  location: z.string().min(1, "Location is required"),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  minVolunteers: z.number().min(1).max(100),
  organizerId: z.string().min(1, "Organizer is required"),
  notes: z.string().optional(),
  coverImage: z.string().optional(),
});

export async function createEvent(
  formData: z.infer<typeof eventSchema>
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = eventSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;

  try {
    const event = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        minVolunteers: data.minVolunteers,
        organizerId: data.organizerId,
        notes: data.notes,
        coverImage: data.coverImage ?? null,
        status: "UPCOMING",
        createdById: session.user.id,
      },
    });

    await logActivity({
      action: "EVENT_CREATED",
      entityType: "Event",
      entityId: event.id,
      description: `Event "${data.title}" created`,
      userId: session.user.id,
      eventId: event.id,
    });

    revalidatePath("/events");
    revalidatePath("/dashboard");
    revalidatePath("/volunteer-board");
    revalidatePath("/calendar");

    return { success: true, data: { id: event.id } };
  } catch (error) {
    console.error("Failed to create event:", error);
    return { success: false, error: "Failed to create event" };
  }
}

export async function updateEvent(
  id: string,
  formData: Partial<z.infer<typeof eventSchema>>
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        assignments: {
          include: { employee: { include: { user: true } } },
        },
      },
    });
    if (!event) return { success: false, error: "Event not found" };

    await prisma.event.update({
      where: { id },
      data: {
        ...(formData.title && { title: formData.title }),
        ...(formData.description !== undefined && {
          description: formData.description,
        }),
        ...(formData.categoryId && { categoryId: formData.categoryId }),
        ...(formData.date && { date: new Date(formData.date) }),
        ...(formData.startTime && { startTime: formData.startTime }),
        ...(formData.endTime && { endTime: formData.endTime }),
        ...(formData.location && { location: formData.location }),
        ...(formData.address !== undefined && { address: formData.address }),
        ...(formData.latitude !== undefined && { latitude: formData.latitude }),
        ...(formData.longitude !== undefined && {
          longitude: formData.longitude,
        }),
        ...(formData.minVolunteers !== undefined && {
          minVolunteers: formData.minVolunteers,
        }),
        ...(formData.organizerId && { organizerId: formData.organizerId }),
        ...(formData.notes !== undefined && { notes: formData.notes }),
        ...(formData.coverImage !== undefined && { coverImage: formData.coverImage || null }),
      },
    });

    await logActivity({
      action: "EVENT_UPDATED",
      entityType: "Event",
      entityId: id,
      description: `Event "${event.title}" updated`,
      userId: session.user.id,
      eventId: id,
    });

    // Notify assigned volunteers
    const userIds = event.assignments
      .map((a: { employee: { userId: string | null } }) => a.employee.userId)
      .filter(Boolean) as string[];
    if (userIds.length > 0) {
      await notifyEventUpdated(userIds, event.title, id);
    }

    revalidatePath(`/events/${id}`);
    revalidatePath("/events");
    revalidatePath("/volunteer-board");
    revalidatePath("/calendar");

    return { success: true };
  } catch (error) {
    console.error("Failed to update event:", error);
    return { success: false, error: "Failed to update event" };
  }
}

export async function cancelEvent(
  id: string,
  reason: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        assignments: {
          include: { employee: { include: { user: true } } },
        },
      },
    });
    if (!event) return { success: false, error: "Event not found" };

    await prisma.event.update({
      where: { id },
      data: {
        isCancelled: true,
        cancelledAt: new Date(),
        cancelledReason: reason,
        status: "CANCELLED",
      },
    });

    await logActivity({
      action: "EVENT_CANCELLED",
      entityType: "Event",
      entityId: id,
      description: `Event "${event.title}" cancelled. Reason: ${reason}`,
      userId: session.user.id,
      eventId: id,
      metadata: { reason },
    });

    // Notify all assigned volunteers
    const userIds = event.assignments
      .map((a: { employee: { userId: string | null } }) => a.employee.userId)
      .filter(Boolean) as string[];
    if (userIds.length > 0) {
      await notifyEventCancelled(userIds, event.title, id);
    }

    revalidatePath(`/events/${id}`);
    revalidatePath("/events");
    revalidatePath("/volunteer-board");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to cancel event" };
  }
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return { success: false, error: "Event not found" };

    // Soft delete: mark as cancelled
    await prisma.event.update({
      where: { id },
      data: {
        isCancelled: true,
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelledReason: "Deleted by administrator",
      },
    });

    await logActivity({
      action: "EVENT_DELETED",
      entityType: "Event",
      entityId: id,
      description: `Event "${event.title}" deleted`,
      userId: session.user.id,
      eventId: id,
    });

    revalidatePath("/events");
    revalidatePath("/dashboard");
    revalidatePath("/volunteer-board");

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete event" };
  }
}

export async function assignVolunteer(
  eventId: string,
  employeeId: string
): Promise<ActionResult<{ assignmentId: string }>> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  try {
    const [event, employee] = await Promise.all([
      prisma.event.findUnique({
        where: { id: eventId },
        include: { _count: { select: { assignments: true } } },
      }),
      prisma.employee.findUnique({
        where: { id: employeeId },
        include: { user: true },
      }),
    ]);

    if (!event) return { success: false, error: "Event not found" };
    if (!employee) return { success: false, error: "Employee not found" };
    if (event.isCancelled) return { success: false, error: "Event is cancelled" };

    // Check if already assigned
    const existing = await prisma.eventAssignment.findUnique({
      where: { eventId_employeeId: { eventId, employeeId } },
    });
    if (existing) return { success: false, error: "Already assigned to this event" };

    // Check availability
    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);
    const unavailable = await prisma.employeeAvailability.findFirst({
      where: { employeeId, date: eventDate, isUnavailable: true },
    });
    if (unavailable) {
      return {
        success: false,
        error: `Employee is unavailable on this date (${unavailable.reason ?? "unavailable"})`,
      };
    }

    const assignment = await prisma.eventAssignment.create({
      data: {
        eventId,
        employeeId,
        assignedById: session.user.id,
      },
    });

    // Auto-mark PRESENT — admin only corrects exceptions on the attendance page
    await prisma.attendanceRecord.upsert({
      where: { eventId_employeeId: { eventId, employeeId } },
      create: { eventId, employeeId, status: "PRESENT", markedById: session.user.id },
      update: { status: "PRESENT", markedById: session.user.id },
    });

    await logActivity({
      action: "VOLUNTEER_ASSIGNED",
      entityType: "Event",
      entityId: eventId,
      description: `${employee.firstName} ${employee.lastName} assigned to "${event.title}"`,
      userId: session.user.id,
      eventId,
      metadata: { employeeId, employeeName: `${employee.firstName} ${employee.lastName}` },
    });

    // Notify employee
    if (employee.userId) {
      await notifyVolunteerAssigned(employee.userId, event.title, eventId);
    }

    // Send assignment email — fire and forget
    sendEventAssignmentEmail(
      employee.email,
      `${employee.firstName} ${employee.lastName}`,
      {
        title: event.title,
        date: new Date(event.date).toLocaleDateString("en-US", {
          weekday: "long", year: "numeric", month: "long", day: "numeric",
        }),
        startTime: event.startTime,
        location: event.location,
      }
    ).catch((err) => console.error("Failed to send assignment email:", err));

    revalidatePath(`/events/${eventId}`);
    revalidatePath("/volunteer-board");
    revalidatePath("/dashboard");

    return { success: true, data: { assignmentId: assignment.id } };
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "P2002") {
      return { success: false, error: "Employee is already assigned" };
    }
    console.error("Failed to assign volunteer:", error);
    return { success: false, error: "Failed to assign volunteer" };
  }
}

export async function removeVolunteer(
  eventId: string,
  employeeId: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const isAdmin = session.user.role === "ADMIN";
  const isSelf = session.user.employeeId === employeeId;

  if (!isAdmin && !isSelf) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const [event, employee] = await Promise.all([
      prisma.event.findUnique({ where: { id: eventId } }),
      prisma.employee.findUnique({
        where: { id: employeeId },
        include: { user: true },
      }),
    ]);

    if (!event || !employee) {
      return { success: false, error: "Not found" };
    }

    await prisma.eventAssignment.delete({
      where: { eventId_employeeId: { eventId, employeeId } },
    });

    // Remove the auto-created attendance record when volunteer is unassigned
    await prisma.attendanceRecord.deleteMany({
      where: { eventId, employeeId },
    });

    await logActivity({
      action: "VOLUNTEER_REMOVED",
      entityType: "Event",
      entityId: eventId,
      description: `${employee.firstName} ${employee.lastName} removed from "${event.title}"`,
      userId: session.user.id,
      eventId,
    });

    // Notify employee
    if (employee.userId && !isSelf) {
      await notifyVolunteerRemoved(employee.userId, event.title, eventId);
    }

    revalidatePath(`/events/${eventId}`);
    revalidatePath("/volunteer-board");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to remove volunteer" };
  }
}
