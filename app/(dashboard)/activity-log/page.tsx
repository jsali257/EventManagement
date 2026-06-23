import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatRelativeTime, formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";

export const metadata: Metadata = { title: "Activity Log" };

async function ActivityLogContent() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const logs = await prisma.activityLog.findMany({
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const actionColors: Record<string, string> = {
    EVENT_CREATED: "bg-green-100 text-green-700",
    EVENT_UPDATED: "bg-blue-100 text-blue-700",
    EVENT_DELETED: "bg-red-100 text-red-700",
    EVENT_CANCELLED: "bg-red-100 text-red-700",
    VOLUNTEER_ASSIGNED: "bg-emerald-100 text-emerald-700",
    VOLUNTEER_REMOVED: "bg-orange-100 text-orange-700",
    ATTENDANCE_MARKED: "bg-blue-100 text-blue-700",
    EMPLOYEE_CREATED: "bg-purple-100 text-purple-700",
    EMPLOYEE_UPDATED: "bg-purple-100 text-purple-700",
    USER_LOGIN: "bg-gray-100 text-gray-600",
    USER_LOGOUT: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Activity Log</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Complete audit trail of all system actions
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Activity className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No activity recorded</p>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{log.description}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {log.user.name ?? log.user.email}
                      </span>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(log.createdAt)}
                      </span>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="text-xs text-muted-foreground/60">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`shrink-0 text-xs ${actionColors[log.action] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {log.action.replace(/_/g, " ")}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ActivityLogPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-40" />
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </div>
      }
    >
      <ActivityLogContent />
    </Suspense>
  );
}
