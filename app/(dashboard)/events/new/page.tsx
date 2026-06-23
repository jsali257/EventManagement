import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventForm } from "@/components/events/event-form";

export const metadata: Metadata = { title: "Create Event" };

export default async function NewEventPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/events");

  const [categories, employees] = await Promise.all([
    prisma.eventCategory.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.employee.findMany({
      where: { isActive: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        jobTitle: true,
      },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl">
      <Button variant="ghost" size="sm" asChild className="w-fit -ml-2">
        <Link href="/events">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Events
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold">Create New Event</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Schedule a new community outreach event
        </p>
      </div>

      <EventForm categories={categories} employees={employees} />
    </div>
  );
}
