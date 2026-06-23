import Link from "next/link";
import { format } from "date-fns";
import { CalendarDays, MapPin, Users, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn, formatTime } from "@/lib/utils";

interface UpcomingEvent {
  id: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
  minVolunteers: number;
  category: { name: string; color: string };
  _count: { assignments: number };
}

interface UpcomingEventsListProps {
  events: UpcomingEvent[];
}

export function UpcomingEventsList({ events }: UpcomingEventsListProps) {
  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold">Upcoming Events</CardTitle>
          <CardDescription>Next scheduled events requiring volunteers</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/events" className="flex items-center gap-1 text-xs">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CalendarDays className="h-10 w-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No upcoming events scheduled</p>
          </div>
        ) : (
          events.map((event) => {
            const fillPct = Math.min(Math.round((event._count.assignments / event.minVolunteers) * 100), 100);
            const goalMet = event._count.assignments >= event.minVolunteers;
            const isPartial = event._count.assignments > 0 && !goalMet;
            const needsVols = event._count.assignments === 0;

            return (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="flex flex-col gap-2 rounded-lg border p-3 transition-all hover:bg-muted/40 hover:border-primary/30 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                      {event.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {format(new Date(event.date), "MMM d")} · {formatTime(event.startTime)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate max-w-[120px]">{event.location}</span>
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="shrink-0 text-xs"
                    style={{ color: event.category.color, borderColor: `${event.category.color}40` }}
                  >
                    {event.category.name}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Progress
                    value={fillPct}
                    className={cn(
                      "h-1.5 flex-1",
                      goalMet && "[&>div]:bg-green-500",
                      isPartial && "[&>div]:bg-yellow-500",
                      needsVols && "[&>div]:bg-red-400"
                    )}
                  />
                  <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {event._count.assignments}/{event.minVolunteers} min
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
