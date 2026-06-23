"use client";

import { format, isToday } from "date-fns";
import { CalendarDays, MapPin, Users, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, formatTime, cn } from "@/lib/utils";

interface TabletAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    avatarColor: string;
    jobTitle: string;
    department: { name: string };
  } | null;
  events: Array<{
    id: string;
    title: string;
    date: Date;
    startTime: string;
    location: string;
    minVolunteers: number;
    isCancelled: boolean;
    category: { name: string; color: string };
    assignments: Array<{ employee: { id: string } }>;
  }>;
  employees: Array<{
    id: string;
    status: string;
    availability: { date: Date; reason: string | null }[];
  }>;
  isAdmin: boolean;
  isAssigned: (employeeId: string, eventId: string) => boolean;
  isEmployeeAvailable: (
    employee: { id: string; status: string; availability: { date: Date; reason: string | null }[] },
    event: { date: Date }
  ) => boolean;
  onAssign: (eventId: string) => Promise<void>;
}

export function TabletAssignDialog({
  open,
  onOpenChange,
  employee,
  events,
  employees,
  isAdmin,
  isAssigned,
  isEmployeeAvailable,
  onAssign,
}: TabletAssignDialogProps) {
  if (!employee) return null;

  const employeeWithAvail = employees.find((e) => e.id === employee.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback
                className="text-white text-sm font-semibold"
                style={{ backgroundColor: employee.avatarColor }}
              >
                {getInitials(`${employee.firstName} ${employee.lastName}`)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-base font-semibold">
                {employee.firstName} {employee.lastName}
              </p>
              <p className="text-xs text-muted-foreground font-normal">
                {employee.department.name}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="text-sm text-muted-foreground mb-3">
          Select an event to assign this volunteer:
        </div>

        <ScrollArea className="max-h-80">
          <div className="space-y-2">
            {events
              .filter((e) => !e.isCancelled)
              .map((event) => {
                const assigned = isAssigned(employee.id, event.id);
                const available =
                  employeeWithAvail &&
                  isEmployeeAvailable(employeeWithAvail, event);
                const goalMet = event.assignments.length >= event.minVolunteers;
                const disabled = assigned || !available;
                const fillPct = Math.min(Math.round(
                  (event.assignments.length / event.minVolunteers) * 100
                ), 100);

                return (
                  <button
                    key={event.id}
                    disabled={disabled}
                    onClick={() => onAssign(event.id)}
                    className={cn(
                      "w-full text-left rounded-lg border p-3 transition-all",
                      disabled
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98]",
                      assigned && "border-green-300 bg-green-50 dark:bg-green-900/20"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {event.title}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {format(new Date(event.date), "MMM d")}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate max-w-[100px]">
                              {event.location}
                            </span>
                          </span>
                        </div>
                      </div>
                      {assigned && (
                        <Check className="h-4 w-4 text-green-600 shrink-0" />
                      )}
                      {goalMet && !assigned && (
                        <Badge variant="secondary" className="text-xs shrink-0 bg-green-100 text-green-700">
                          Goal Met
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Progress
                        value={fillPct}
                        className={cn(
                          "h-1 flex-1",
                          goalMet ? "[&>div]:bg-green-500" : "[&>div]:bg-primary"
                        )}
                      />
                      <span className="text-xs text-muted-foreground">
                        {event.assignments.length}/{event.minVolunteers} min
                      </span>
                    </div>
                  </button>
                );
              })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
