import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AttendanceTracker } from "@/components/attendance/attendance-tracker";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  params: Promise<{ eventId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { eventId } = await params;
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { title: true },
  });
  return { title: `Attendance - ${event?.title ?? "Event"}` };
}

export default async function AttendancePage({ params }: Props) {
  const { eventId } = await params;
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const [event, availableEmployees] = await Promise.all([
    prisma.event.findUnique({
      where: { id: eventId },
      include: {
        assignments: {
          include: {
            employee: {
              include: { department: { select: { name: true } } },
            },
          },
          orderBy: { employee: { lastName: "asc" } },
        },
        attendance: true,
      },
    }),
    prisma.employee.findMany({
      where: {
        isActive: true,
        NOT: { assignments: { some: { eventId } } },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        jobTitle: true,
        avatarColor: true,
        department: { select: { name: true } },
      },
      orderBy: { lastName: "asc" },
    }),
  ]);

  if (!event) notFound();

  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl">
      <Button variant="ghost" size="sm" asChild className="w-fit -ml-2">
        <Link href={`/events/${event.id}`}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Event
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold">Mark Attendance</h1>
        <p className="text-muted-foreground text-sm mt-1">{event.title}</p>
      </div>

      <AttendanceTracker event={event} availableEmployees={availableEmployees} />
    </div>
  );
}
