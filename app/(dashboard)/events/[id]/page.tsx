import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EventDetail } from "@/components/events/event-detail";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    select: { title: true },
  });
  if (!event) return { title: "Not Found" };
  return { title: event.title };
}

async function EventDetailContent({ id }: { id: string }) {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      category: true,
      organizer: {
        include: { department: { select: { name: true } } },
      },
      createdBy: { select: { name: true, email: true } },
      assignments: {
        include: {
          employee: {
            include: {
              department: { select: { name: true, color: true } },
            },
          },
          assignedBy: { select: { name: true } },
        },
        orderBy: { assignedAt: "asc" },
      },
      attendance: {
        include: {
          employee: {
            select: { firstName: true, lastName: true, avatarColor: true },
          },
          markedBy: { select: { name: true } },
        },
      },
      attachments: {
        include: { uploadedBy: { select: { name: true } } },
        orderBy: { uploadedAt: "desc" },
      },
      photos: {
        include: { uploadedBy: { select: { name: true } } },
        orderBy: { uploadedAt: "desc" },
      },
      activityLog: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!event) notFound();

  const isAssigned = session?.user?.employeeId
    ? event.assignments.some((a) => a.employeeId === session.user?.employeeId)
    : false;

  return (
    <EventDetail
      event={event}
      isAdmin={isAdmin}
      currentUserId={session?.user?.id ?? ""}
      currentEmployeeId={session?.user?.employeeId ?? null}
      isAssigned={isAssigned}
    />
  );
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-12 rounded-xl w-96" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      }
    >
      <EventDetailContent id={id} />
    </Suspense>
  );
}
