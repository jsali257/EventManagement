"use client";

import { useState } from "react";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";
import {
  Bell, UserPlus, UserMinus, CalendarX, CalendarDays,
  AlertCircle, CheckSquare, Trash2, CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "@/actions/notifications";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: Date;
}

const notificationIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  ASSIGNED: UserPlus,
  REMOVED: UserMinus,
  EVENT_CANCELLED: CalendarX,
  EVENT_UPDATED: CalendarDays,
  VOLUNTEER_NEEDED: AlertCircle,
  ATTENDANCE_MISSING: CheckSquare,
  GENERAL: Bell,
};

export function NotificationsList({
  notifications: initial,
}: {
  notifications: NotificationItem[];
}) {
  const [notifications, setNotifications] = useState(initial);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    await markNotificationRead(id);
  };

  const handleDelete = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const result = await deleteNotification(id);
    if (!result.success) {
      toast.error("Failed to delete notification");
    }
  };

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await markAllNotificationsRead();
    setIsMarkingAll(false);
    toast.success("All notifications marked as read");
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Bell className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold">All caught up!</h3>
        <p className="text-sm text-muted-foreground mt-1">
          No notifications yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            disabled={isMarkingAll}
            onClick={handleMarkAllRead}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((notification) => {
          const Icon = notificationIcons[notification.type] ?? Bell;
          const content = (
            <div
              key={notification.id}
              className={cn(
                "group relative flex gap-3 rounded-xl border p-4 transition-all hover:shadow-sm",
                !notification.isRead && "bg-primary/5 border-primary/20"
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                  !notification.isRead
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={cn(
                      "text-sm",
                      !notification.isRead ? "font-semibold" : "font-medium"
                    )}
                  >
                    {notification.title}
                  </p>
                  <div className="flex items-center gap-1 shrink-0">
                    {!notification.isRead && (
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDelete(notification.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {formatRelativeTime(notification.createdAt)}
                </p>
              </div>
            </div>
          );

          if (notification.actionUrl) {
            return (
              <Link
                key={notification.id}
                href={notification.actionUrl}
                onClick={() => !notification.isRead && handleMarkRead(notification.id)}
              >
                {content}
              </Link>
            );
          }

          return (
            <div
              key={notification.id}
              onClick={() => !notification.isRead && handleMarkRead(notification.id)}
              className="cursor-pointer"
            >
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
