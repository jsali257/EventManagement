import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay } from "date-fns";
import { VolunteerBoard } from "@/components/volunteer-board/volunteer-board";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Volunteer Board" };

async function VolunteerBoardContent() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";
  const today = startOfDay(new Date());

  const [events, employees] = await Promise.all([
    prisma.event.findMany({
      where: {
        date: { gte: today },
        isCancelled: false,
      },
      select: {
        id: true,
        title: true,
        date: true,
        startTime: true,
        endTime: true,
        location: true,
        minVolunteers: true,
        isCancelled: true,
        coverImage: true,
        category: { select: { name: true, color: true } },
        assignments: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                jobTitle: true,
                avatarColor: true,
                profilePicture: true,
                status: true,
                department: { select: { name: true } },
              },
            },
          },
          orderBy: { assignedAt: "asc" },
        },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 20,
    }),
    prisma.employee.findMany({
      where: { isActive: true, status: { not: "INACTIVE" } },
      include: {
        department: { select: { name: true, color: true } },
        availability: {
          where: {
            date: { gte: today },
            isUnavailable: true,
          },
          select: { date: true, reason: true },
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
  ]);

  return (
    <VolunteerBoard
      events={events}
      employees={employees}
      isAdmin={isAdmin}
      currentEmployeeId={session?.user?.employeeId ?? null}
    />
  );
}

export default function VolunteerBoardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col h-screen p-4 gap-4">
          <Skeleton className="h-10 w-60" />
          <div className="flex gap-4 flex-1">
            <Skeleton className="w-64 h-full rounded-xl" />
            <div className="flex gap-4 flex-1 overflow-hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="w-72 h-full rounded-xl shrink-0" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <VolunteerBoardContent />
    </Suspense>
  );
}
