"use client";

import { useRef, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  color: string;
  extendedProps: {
    location: string;
    status: string;
    volunteers: number;
    minVolunteers: number;
    categoryName: string;
    categoryColor: string;
  };
}

interface CalendarViewProps {
  events: CalendarEvent[];
}

export function CalendarView({ events }: CalendarViewProps) {
  const router = useRouter();
  const calendarRef = useRef<FullCalendar>(null);

  const handleEventClick = useCallback(
    (info: { event: { id: string } }) => {
      router.push(`/events/${info.event.id}`);
    },
    [router]
  );

  const renderEventContent = (eventInfo: {
    event: {
      title: string;
      extendedProps: CalendarEvent["extendedProps"];
    };
    timeText: string;
  }) => {
    const { volunteers, minVolunteers, categoryName } = eventInfo.event.extendedProps;
    return (
      <div className="p-0.5 text-xs overflow-hidden">
        <div className="font-medium truncate">{eventInfo.event.title}</div>
        <div className="text-[10px] opacity-80">
          {volunteers}/{minVolunteers} · {categoryName}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground text-sm mt-1">
          View and manage all events on the calendar
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-red-500" />
          Needs Volunteers
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-yellow-500" />
          Partially Filled
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-green-500" />
          Full
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-blue-500" />
          Upcoming
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-gray-500" />
          Cancelled
        </span>
      </div>

      <Card>
        <CardContent className="p-4">
          <FullCalendar
            ref={calendarRef}
            plugins={[
              dayGridPlugin,
              timeGridPlugin,
              interactionPlugin,
              listPlugin,
            ]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay,listMonth",
            }}
            events={events}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            eventDisplay="block"
            dayMaxEvents={4}
            moreLinkClick="popover"
            height="auto"
            aspectRatio={1.8}
            buttonText={{
              today: "Today",
              month: "Month",
              week: "Week",
              day: "Day",
              list: "Agenda",
            }}
            nowIndicator={true}
            eventMouseEnter={(info) => {
              info.el.style.cursor = "pointer";
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
