import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { ClipboardList, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Attendance" };

async function AttendanceContent() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  // Events that have already happened and have assignments
  const events = await prisma.event.findMany({
    where: {
      isCancelled: false,
      date: { lte: new Date() },
      assignments: { some: {} },
    },
    include: {
      category: { select: { name: true, color: true } },
      _count: { select: { assignments: true, attendance: true } },
    },
    orderBy: { date: "desc" },
    take: 100,
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Attendance</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Mark attendance for past events with volunteer assignments
        </p>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <ClipboardList className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold">No past events found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Events that have passed with volunteers assigned will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-2">
          {events.map((event) => {
            const recorded = event._count.attendance;
            const total = event._count.assignments;
            const isComplete = recorded >= total;

            return (
              <Link key={event.id} href={`/attendance/${event.id}`}>
                <Card className="hover:shadow-sm transition-shadow cursor-pointer group">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm truncate">{event.title}</p>
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0"
                          style={{
                            backgroundColor: `${event.category.color}20`,
                            color: event.category.color,
                          }}
                        >
                          {event.category.name}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(event.date), "MMMM d, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge
                        variant="outline"
                        className={
                          isComplete
                            ? "text-green-600 border-green-300"
                            : recorded === 0
                            ? "text-red-500 border-red-300"
                            : "text-yellow-600 border-yellow-300"
                        }
                      >
                        {isComplete
                          ? "Complete"
                          : recorded === 0
                          ? "Not recorded"
                          : `${recorded}/${total}`}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AttendancePage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-40" />
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>
      }
    >
      <AttendanceContent />
    </Suspense>
  );
}
