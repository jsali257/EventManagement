import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationsList } from "@/components/notifications/notifications-list";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Notifications" };

async function NotificationsContent() {
  const session = await auth();
  if (!session?.user) return null;

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {notifications.filter((n) => !n.isRead).length} unread
        </p>
      </div>
      <NotificationsList notifications={notifications} />
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-3">
          <Skeleton className="h-8 w-40" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      }
    >
      <NotificationsContent />
    </Suspense>
  );
}
