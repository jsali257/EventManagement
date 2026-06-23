import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  CalendarPlus,
  UserPlus,
  UserMinus,
  CheckSquare,
  CalendarX,
  Edit,
  Clock,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

type ActivityAction = string;

interface ActivityItem {
  id: string;
  action: ActivityAction;
  description: string;
  createdAt: Date;
  user: { name: string | null; email: string };
}

const actionConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  EVENT_CREATED: { icon: CalendarPlus, color: "text-green-500" },
  EVENT_UPDATED: { icon: Edit, color: "text-blue-500" },
  EVENT_CANCELLED: { icon: CalendarX, color: "text-red-500" },
  VOLUNTEER_ASSIGNED: { icon: UserPlus, color: "text-green-500" },
  VOLUNTEER_REMOVED: { icon: UserMinus, color: "text-orange-500" },
  ATTENDANCE_MARKED: { icon: CheckSquare, color: "text-blue-500" },
  ATTENDANCE_UPDATED: { icon: CheckSquare, color: "text-blue-500" },
  USER_LOGIN: { icon: Clock, color: "text-muted-foreground" },
};

export function RecentActivity({ activities }: { activities: ActivityItem[] }) {
  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
          <CardDescription>Latest system events and actions</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/activity-log" className="flex items-center gap-1 text-xs">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="h-10 w-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-4">
              {activities.map((activity) => {
                const config = actionConfig[activity.action] ?? {
                  icon: Activity,
                  color: "text-muted-foreground",
                };
                const Icon = config.icon;

                return (
                  <div key={activity.id} className="flex gap-4 pl-1">
                    <div
                      className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-background ${config.color}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-sm leading-snug">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {activity.user.name ?? activity.user.email}
                        </span>
                        <span className="text-xs text-muted-foreground/50">·</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
