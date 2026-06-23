import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventForm } from "@/components/events/event-form";
import { format } from "date-fns";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    select: { title: true },
  });
  return { title: event ? `Edit: ${event.title}` : "Edit Event" };
}

export default async function EditEventPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect(`/events/${id}`);

  const [event, categories, employees] = await Promise.all([
    prisma.event.findUnique({ where: { id } }),
    prisma.eventCategory.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.employee.findMany({
      where: { isActive: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true, jobTitle: true },
    }),
  ]);

  if (!event) notFound();
  if (event.isCancelled) redirect(`/events/${id}`);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl">
      <Button variant="ghost" size="sm" asChild className="w-fit -ml-2">
        <Link href={`/events/${id}`}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Event
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold">Edit Event</h1>
        <p className="text-muted-foreground text-sm mt-1">{event.title}</p>
      </div>

      <EventForm
        categories={categories}
        employees={employees}
        eventId={event.id}
        currentCoverImage={event.coverImage ?? null}
        defaultValues={{
          title: event.title,
          description: event.description ?? "",
          categoryId: event.categoryId,
          date: format(new Date(event.date), "yyyy-MM-dd"),
          startTime: event.startTime,
          endTime: event.endTime,
          location: event.location,
          address: event.address ?? "",
          minVolunteers: event.minVolunteers,
          organizerId: event.organizerId ?? "",
          notes: event.notes ?? "",
        }}
      />
    </div>
  );
}
