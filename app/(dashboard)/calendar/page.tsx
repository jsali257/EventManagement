import type { Metadata } from "next";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { CalendarView } from "@/components/calendar/calendar-view";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Calendar" };

async function CalendarContent() {
  const events = await prisma.event.findMany({
    include: {
      category: { select: { name: true, color: true } },
      _count: { select: { assignments: true } },
    },
    orderBy: { date: "asc" },
  });

  // Transform for FullCalendar
  const calendarEvents = events.map((event) => {
    const fillPct =
      event.minVolunteers > 0
        ? event._count.assignments / event.minVolunteers
        : 0;
    let color = "#3B82F6";
    if (event.isCancelled) color = "#6B7280";
    else if (fillPct === 0) color = "#EF4444";
    else if (fillPct >= 1) color = "#22C55E";
    else color = "#F59E0B";

    return {
      id: event.id,
      title: event.title,
      start: `${event.date.toISOString().split("T")[0]}T${event.startTime}`,
      end: `${event.date.toISOString().split("T")[0]}T${event.endTime}`,
      color,
      extendedProps: {
        location: event.location,
        status: event.isCancelled ? "cancelled" : fillPct >= 1 ? "full" : fillPct === 0 ? "needs-volunteers" : "partial",
        volunteers: event._count.assignments,
        minVolunteers: event.minVolunteers,
        categoryName: event.category.name,
        categoryColor: event.category.color,
      },
    };
  });

  return <CalendarView events={calendarEvents} />;
}

export default function CalendarPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6">
          <Skeleton className="h-[600px] rounded-xl" />
        </div>
      }
    >
      <CalendarContent />
    </Suspense>
  );
}
