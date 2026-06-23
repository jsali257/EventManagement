import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EventsList } from "@/components/events/events-list";
import { EventsFilters } from "@/components/events/events-filters";
import { startOfDay } from "date-fns";

export const metadata: Metadata = { title: "Events" };

interface SearchParams {
  status?: string;
  category?: string;
  search?: string;
  date?: string;
  view?: "grid" | "list";
  page?: string;
}

async function EventsContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";
  const page = parseInt(params.page ?? "1");
  const pageSize = 20;

  const today = startOfDay(new Date());

  const where = {
    ...(params.status === "upcoming" && { date: { gte: today }, isCancelled: false }),
    ...(params.status === "today" && {
      date: { gte: today, lte: new Date(today.getTime() + 86400000 - 1) },
      isCancelled: false,
    }),
    ...(params.status === "completed" && { date: { lt: today }, isCancelled: false }),
    ...(params.status === "cancelled" && { isCancelled: true }),
    ...(params.category && { categoryId: params.category }),
    ...(params.search && {
      OR: [
        { title: { contains: params.search, mode: "insensitive" as const } },
        { location: { contains: params.search, mode: "insensitive" as const } },
        { description: { contains: params.search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [events, total, categories] = await Promise.all([
    prisma.event.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, color: true } },
        organizer: { select: { firstName: true, lastName: true } },
        _count: { select: { assignments: true, photos: true, attachments: true } },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.event.count({ where }),
    prisma.eventCategory.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {total} event{total !== 1 ? "s" : ""} found
          </p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link href="/events/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <EventsFilters categories={categories} />

      {/* Events List */}
      <EventsList
        events={events}
        total={total}
        page={page}
        pageSize={pageSize}
        isAdmin={isAdmin}
      />
    </div>
  );
}

export default function EventsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-40" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        </div>
      }
    >
      <EventsContent searchParams={searchParams} />
    </Suspense>
  );
}
