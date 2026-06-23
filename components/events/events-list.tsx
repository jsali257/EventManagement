"use client";

import Link from "next/link";
import { format, isToday, isFuture, isPast } from "date-fns";
import { motion } from "framer-motion";
import {
  CalendarDays,
  MapPin,
  Clock,
  Users,
  MoreVertical,
  Edit,
  XCircle,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { formatTime, cn, getEventStatusLabel } from "@/lib/utils";
import { CalendarDays as EmptyIcon } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string | null;
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
  minVolunteers: number;
  isCancelled: boolean;
  status: string;
  category: { id: string; name: string; color: string };
  organizer: { firstName: string; lastName: string };
  _count: { assignments: number; photos: number; attachments: number };
}

interface EventsListProps {
  events: Event[];
  total: number;
  page: number;
  pageSize: number;
  isAdmin?: boolean;
}

function getStatusBadgeStyle(event: Event) {
  if (event.isCancelled) {
    return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  }
  const eventDate = new Date(event.date);
  if (isToday(eventDate)) {
    return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
  }
  if (isPast(eventDate)) {
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  }
  const pct = (event._count.assignments / event.minVolunteers) * 100;
  if (pct === 0) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  if (pct >= 100) return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
}

function getStatusLabel(event: Event): string {
  if (event.isCancelled) return "Cancelled";
  const eventDate = new Date(event.date);
  if (isToday(eventDate)) return "Today";
  if (isPast(eventDate)) return "Completed";
  const pct = (event._count.assignments / event.minVolunteers) * 100;
  if (pct === 0) return "Needs Volunteers";
  if (pct >= 100) return "Goal Met";
  return "Partially Filled";
}

function getProgressColor(pct: number, cancelled: boolean): string {
  if (cancelled) return "[&>div]:bg-gray-400";
  if (pct === 0) return "[&>div]:bg-red-500";
  if (pct >= 100) return "[&>div]:bg-green-500";
  return "[&>div]:bg-yellow-500";
}

export function EventsList({
  events,
  total,
  page,
  pageSize,
  isAdmin,
}: EventsListProps) {
  const totalPages = Math.ceil(total / pageSize);

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <EmptyIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold">No events found</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your filters or create a new event
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-3">
        {events.map((event, index) => {
          const pct = Math.round(
            (event._count.assignments / event.minVolunteers) * 100
          );

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
            >
              <Link href={`/events/${event.id}`}>
                <div
                  className={cn(
                    "group relative rounded-xl border bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30",
                    event.isCancelled && "opacity-70"
                  )}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                    {/* Date column */}
                    <div className="hidden sm:flex shrink-0 flex-col items-center justify-center w-14 rounded-lg bg-muted p-2 text-center">
                      <span className="text-xs font-medium text-muted-foreground uppercase">
                        {format(new Date(event.date), "MMM")}
                      </span>
                      <span className="text-2xl font-bold leading-none">
                        {format(new Date(event.date), "d")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(event.date), "EEE")}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                              {event.title}
                            </h3>
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0",
                                getStatusBadgeStyle(event)
                              )}
                            >
                              {getStatusLabel(event)}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1 sm:hidden">
                              <CalendarDays className="h-3 w-3" />
                              {format(new Date(event.date), "MMM d")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(event.startTime)} – {formatTime(event.endTime)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate max-w-[180px]">{event.location}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-3 mt-2">
                            <Badge
                              variant="outline"
                              className="text-xs"
                              style={{
                                color: event.category.color,
                                borderColor: `${event.category.color}40`,
                              }}
                            >
                              {event.category.name}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {event.organizer.firstName} {event.organizer.lastName}
                            </span>
                          </div>
                        </div>

                        {isAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              asChild
                              onClick={(e) => e.preventDefault()}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/events/${event.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              {!event.isCancelled && (
                                <DropdownMenuItem asChild>
                                  <Link href={`/events/${event.id}/edit`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Event
                                  </Link>
                                </DropdownMenuItem>
                              )}
                              {!event.isCancelled && (
                                <DropdownMenuItem className="text-destructive">
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Cancel Event
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>

                      {/* Volunteer progress */}
                      <div className="flex items-center gap-2 mt-3">
                        <Progress
                          value={Math.min(pct, 100)}
                          className={cn(
                            "h-1.5 flex-1",
                            getProgressColor(pct, event.isCancelled)
                          )}
                        />
                        <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1 min-w-[50px]">
                          <Users className="h-3 w-3" />
                          {event._count.assignments}/{event.minVolunteers}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={`?page=${page - 1}`}
                aria-disabled={page <= 1}
                className={page <= 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
              <PaginationItem key={i + 1}>
                <PaginationLink href={`?page=${i + 1}`} isActive={i + 1 === page}>
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href={`?page=${page + 1}`}
                aria-disabled={page >= totalPages}
                className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
