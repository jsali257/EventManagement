"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import type { ActionResult } from "@/types";

const attendanceSchema = z.object({
  eventId: z.string(),
  employeeId: z.string(),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
  notes: z.string().optional(),
});

export async function markAttendance(
  data: z.infer<typeof attendanceSchema>
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = attendanceSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Validation failed" };

  try {
    const record = await prisma.attendanceRecord.upsert({
      where: {
        eventId_employeeId: {
          eventId: data.eventId,
          employeeId: data.employeeId,
        },
      },
      update: {
        status: data.status,
        notes: data.notes,
        markedById: session.user.id,
        markedAt: new Date(),
      },
      create: {
        eventId: data.eventId,
        employeeId: data.employeeId,
        status: data.status,
        notes: data.notes,
        markedById: session.user.id,
      },
    });

    // Update employee stats
    await updateEmployeeStats(data.employeeId);

    await logActivity({
      action: "ATTENDANCE_MARKED",
      entityType: "Event",
      entityId: data.eventId,
      description: `Attendance marked: ${data.status} for employee`,
      userId: session.user.id,
      eventId: data.eventId,
      metadata: { employeeId: data.employeeId, status: data.status },
    });

    revalidatePath(`/events/${data.eventId}`);
    revalidatePath(`/attendance/${data.eventId}`);
    revalidatePath(`/employees/${data.employeeId}`);

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to mark attendance" };
  }
}

export async function markBulkAttendance(
  eventId: string,
  records: Array<{ employeeId: string; status: string; notes?: string }>
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    for (const record of records) {
      await prisma.attendanceRecord.upsert({
        where: {
          eventId_employeeId: { eventId, employeeId: record.employeeId },
        },
        update: {
          status: record.status as never,
          notes: record.notes,
          markedById: session.user.id,
          markedAt: new Date(),
        },
        create: {
          eventId,
          employeeId: record.employeeId,
          status: record.status as never,
          notes: record.notes,
          markedById: session.user.id,
        },
      });
    }

    // Update stats for all employees
    await Promise.all(
      records.map((r) => updateEmployeeStats(r.employeeId))
    );

    await logActivity({
      action: "ATTENDANCE_MARKED",
      entityType: "Event",
      entityId: eventId,
      description: `Attendance marked for ${records.length} volunteers`,
      userId: session.user.id,
      eventId,
      metadata: { count: records.length },
    });

    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/attendance/${eventId}`);

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to save attendance" };
  }
}

export async function addWalkInAttendee(
  eventId: string,
  employeeId: string
): Promise<ActionResult<{ employee: { id: string; firstName: string; lastName: string; jobTitle: string; avatarColor: string; department: { name: string } } }>> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const [event, employee] = await Promise.all([
      prisma.event.findUnique({ where: { id: eventId } }),
      prisma.employee.findUnique({
        where: { id: employeeId },
        include: { department: { select: { name: true } } },
      }),
    ]);

    if (!event) return { success: false, error: "Event not found" };
    if (!employee) return { success: false, error: "Employee not found" };

    // Create assignment if not already there
    await prisma.eventAssignment.upsert({
      where: { eventId_employeeId: { eventId, employeeId } },
      create: { eventId, employeeId, assignedById: session.user.id },
      update: {},
    });

    // Mark as PRESENT
    await prisma.attendanceRecord.upsert({
      where: { eventId_employeeId: { eventId, employeeId } },
      create: { eventId, employeeId, status: "PRESENT", markedById: session.user.id },
      update: { status: "PRESENT", markedById: session.user.id },
    });

    await updateEmployeeStats(employeeId);

    await logActivity({
      action: "ATTENDANCE_MARKED",
      entityType: "Event",
      entityId: eventId,
      description: `Walk-in: ${employee.firstName} ${employee.lastName} added to "${event.title}"`,
      userId: session.user.id,
      eventId,
      metadata: { employeeId, walkIn: true },
    });

    revalidatePath(`/attendance/${eventId}`);
    revalidatePath(`/events/${eventId}`);

    return {
      success: true,
      data: {
        employee: {
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          jobTitle: employee.jobTitle,
          avatarColor: employee.avatarColor,
          department: employee.department,
        },
      },
    };
  } catch (error) {
    console.error("Walk-in error:", error);
    return { success: false, error: "Failed to add walk-in attendee" };
  }
}

async function updateEmployeeStats(employeeId: string) {
  try {
    const allAttendance = await prisma.attendanceRecord.findMany({
      where: { employeeId },
      include: {
        event: { select: { startTime: true, endTime: true } },
      },
    });

    const attended = allAttendance.filter(
      (a: { status: string }) => a.status === "PRESENT" || a.status === "LATE"
    );
    const eventsAttended = attended.length;
    const totalRecords = allAttendance.length;
    const attendanceRate =
      totalRecords > 0 ? (attended.length / totalRecords) * 100 : 0;

    // Calculate hours from event durations
    let totalMinutes = 0;
    for (const record of attended) {
      const [startH, startM] = record.event.startTime.split(":").map(Number);
      const [endH, endM] = record.event.endTime.split(":").map(Number);
      totalMinutes += (endH * 60 + endM) - (startH * 60 + startM);
    }
    const volunteerHours = totalMinutes / 60;

    // Find last volunteer date
    const lastRecord = attended.sort((a: { event: { startTime: string } }, b: { event: { startTime: string } }) =>
      new Date(b.event.startTime).getTime() - new Date(a.event.startTime).getTime()
    )[0];

    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        eventsAttended,
        attendanceRate: Math.round(attendanceRate * 10) / 10,
        volunteerHours: Math.round(volunteerHours * 10) / 10,
      },
    });
  } catch (error) {
    console.error("Failed to update employee stats:", error);
  }
}
