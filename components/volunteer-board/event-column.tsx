"use client";

import Link from "next/link";
import { format, isToday } from "date-fns";
import { useDroppable } from "@dnd-kit/core";
import {
  CalendarDays,
  MapPin,
  Clock,
  Users,
  ExternalLink,
  UserMinus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmployeeCard } from "./employee-card";
import { formatTime, cn } from "@/lib/utils";
import { proxyUrl } from "@/lib/proxy-url";

interface EventColumnProps {
  event: {
    id: string;
    title: string;
    date: Date;
    startTime: string;
    endTime: string;
    location: string;
    minVolunteers: number;
    isCancelled: boolean;
    coverImage?: string | null;
    category: { name: string; color: string };
    assignments: Array<{
      employee: {
        id: string;
        firstName: string;
        lastName: string;
        jobTitle: string;
        avatarColor: string;
        profilePicture: string | null;
        status: string;
        department: { name: string };
      };
    }>;
  };
  employees: Array<{
    id: string;
    availability: { date: Date }[];
  }>;
  isOver: boolean;
  isAdmin: boolean;
  isMobile: boolean;
  onRemoveVolunteer?: (employeeId: string) => void;
}

export function EventColumn({
  event,
  employees,
  isOver,
  isAdmin,
  isMobile,
  onRemoveVolunteer,
}: EventColumnProps) {
  const { setNodeRef } = useDroppable({ id: event.id });

  const assignedCount = event.assignments.length;
  const goalMet = assignedCount >= event.minVolunteers;
  const fillPct = Math.min(Math.round((assignedCount / event.minVolunteers) * 100), 100);
  const eventDate = new Date(event.date);
  const isEventToday = isToday(eventDate);

  const handleRemove = (employeeId: string) => {
    onRemoveVolunteer?.(employeeId);
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col w-72 shrink-0 rounded-xl border bg-card shadow-sm transition-all duration-200 overflow-hidden",
        isOver && "ring-2 ring-primary bg-primary/5 shadow-md",
        isEventToday && "border-purple-300 dark:border-purple-700",
        event.isCancelled && "opacity-60"
      )}
    >
      {/* Cover image banner */}
      {event.coverImage && (
        <div className="w-full h-24 shrink-0 overflow-hidden">
          <img
            src={proxyUrl(event.coverImage)}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <Badge
                variant="outline"
                className="text-[10px] py-0"
                style={{
                  color: event.category.color,
                  borderColor: `${event.category.color}40`,
                }}
              >
                {event.category.name}
              </Badge>
              {isEventToday && (
                <Badge variant="secondary" className="text-[10px] py-0 bg-purple-100 text-purple-700">
                  Today
                </Badge>
              )}
              {goalMet && (
                <Badge variant="secondary" className="text-[10px] py-0 bg-green-100 text-green-700">
                  Goal Met
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-sm leading-tight line-clamp-2">
              {event.title}
            </h3>
          </div>
          <Link
            href={`/events/${event.id}`}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="space-y-1 mt-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3 w-3 shrink-0" />
            {format(eventDate, "EEE, MMM d")}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3 shrink-0" />
            {formatTime(event.startTime)} – {formatTime(event.endTime)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3 w-3" />
              {assignedCount} signed up · {event.minVolunteers} needed
            </span>
            <span
              className={cn(
                "font-medium",
                goalMet ? "text-green-600" : assignedCount === 0 ? "text-red-500" : "text-yellow-600"
              )}
            >
              {fillPct}%
            </span>
          </div>
          <Progress
            value={Math.min(fillPct, 100)}
            className={cn(
              "h-1.5",
              fillPct === 0 && "[&>div]:bg-red-500",
              fillPct > 0 && fillPct < 100 && "[&>div]:bg-yellow-500",
              fillPct >= 100 && "[&>div]:bg-green-500"
            )}
          />
        </div>
      </div>

      {/* Volunteer slots */}
      <ScrollArea className="flex-1 max-h-60">
        <div className="p-2 space-y-1.5">
          {event.assignments.map((assignment) => (
            <div key={assignment.employee.id} className="group flex items-center gap-1">
              <div className="flex-1">
                <EmployeeCard
                  employee={assignment.employee as never}
                  compact
                  isInEvent
                />
              </div>
              {isAdmin && !event.isCancelled && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive shrink-0"
                  onClick={() => handleRemove(assignment.employee.id)}
                >
                  <UserMinus className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}

          {/* Drop hint when dragging */}
          {isOver && (
            <div className="rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 h-8 flex items-center justify-center">
              <span className="text-xs text-primary font-medium">Drop here</span>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Drop hint footer */}
      {!isMobile && !event.isCancelled && (
        <div
          className={cn(
            "px-4 pb-3 pt-1 text-center transition-all",
            isOver ? "opacity-100" : "opacity-0"
          )}
        >
          <span className="text-xs text-primary font-medium">
            Release to assign volunteer
          </span>
        </div>
      )}
    </div>
  );
}
