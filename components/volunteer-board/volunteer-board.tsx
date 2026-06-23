"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  pointerWithin,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { Users, Search, Tablet } from "lucide-react";
import { isSameDay } from "date-fns";
import { assignVolunteer, removeVolunteer } from "@/actions/events";
import { EmployeeCard } from "./employee-card";
import { EventColumn } from "./event-column";
import { TabletAssignDialog } from "./tablet-assign-dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  avatarColor: string;
  profilePicture: string | null;
  status: string;
  department: { name: string; color: string };
  availability: { date: Date; reason: string | null }[];
}

interface Assignment {
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
}

interface BoardEvent {
  id: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
  minVolunteers: number;
  isCancelled: boolean;
  coverImage: string | null;
  category: { name: string; color: string };
  assignments: Assignment[];
}

interface VolunteerBoardProps {
  events: BoardEvent[];
  employees: Employee[];
  isAdmin: boolean;
  currentEmployeeId: string | null;
}

export function VolunteerBoard({
  events: initialEvents,
  employees,
  isAdmin,
  currentEmployeeId,
}: VolunteerBoardProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [events, setEvents] = useState(initialEvents);
  const [activeEmployee, setActiveEmployee] = useState<Employee | null>(null);
  const [overEventId, setOverEventId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const isDragging = useRef(false);

  // Tablet two-tap state
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [tabletDialogOpen, setTabletDialogOpen] = useState(false);

  // Sync server data into local state after each router.refresh(), but not mid-drag
  useEffect(() => {
    if (!isDragging.current) {
      setEvents(initialEvents);
    }
  }, [initialEvents]);

  // Poll every 30 s; also refresh when tab becomes visible again
  useEffect(() => {
    const tick = () => router.refresh();
    const interval = setInterval(tick, 30_000);
    const onVisible = () => { if (document.visibilityState === "visible") tick(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router]);

  // Sensors — disabled on mobile so useDroppable hooks still work inside DndContext
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor)
  );

  const filteredEmployees = employees.filter((emp) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      emp.firstName.toLowerCase().includes(q) ||
      emp.lastName.toLowerCase().includes(q) ||
      emp.jobTitle.toLowerCase().includes(q) ||
      emp.department.name.toLowerCase().includes(q)
    );
  });

  const isEmployeeAvailableForEvent = useCallback(
    (employee: { status: string; availability: { date: Date; reason: string | null }[] }, event: { date: Date }) => {
      if (employee.status === "INACTIVE") return false;
      return !employee.availability.some((a) =>
        isSameDay(new Date(a.date), new Date(event.date))
      );
    },
    []
  );

  const isAssigned = useCallback(
    (employeeId: string, eventId: string) => {
      const event = events.find((e) => e.id === eventId);
      return event?.assignments.some((a) => a.employee.id === employeeId) ?? false;
    },
    [events]
  );

  const handleAssign = useCallback(
    async (employeeId: string, eventId: string) => {
      const event = events.find((e) => e.id === eventId);
      const employee = employees.find((e) => e.id === employeeId);
      if (!event || !employee) return;

      if (isAssigned(employeeId, eventId)) {
        toast.error("Employee is already assigned to this event");
        return;
      }
      if (!isEmployeeAvailableForEvent(employee, event)) {
        toast.error("Employee is marked unavailable on this date");
        return;
      }

      // Optimistic update
      setEvents((prev) =>
        prev.map((e) => {
          if (e.id !== eventId) return e;
          return {
            ...e,
            assignments: [
              ...e.assignments,
              {
                employee: {
                  id: employee.id,
                  firstName: employee.firstName,
                  lastName: employee.lastName,
                  jobTitle: employee.jobTitle,
                  avatarColor: employee.avatarColor,
                  profilePicture: employee.profilePicture,
                  status: employee.status,
                  department: employee.department,
                },
              },
            ],
          };
        })
      );

      setIsAssigning(true);
      try {
        const result = await assignVolunteer(eventId, employeeId);
        if (result.success) {
          toast.success(`${employee.firstName} ${employee.lastName} assigned!`);
        } else {
          setEvents(initialEvents);
          toast.error(result.error ?? "Failed to assign volunteer");
        }
      } catch {
        setEvents(initialEvents);
        toast.error("An error occurred");
      } finally {
        setIsAssigning(false);
      }
    },
    [events, employees, isAssigned, isEmployeeAvailableForEvent, initialEvents]
  );

  const handleRemove = useCallback(
    async (employeeId: string, eventId: string) => {
      // Optimistic update
      setEvents((prev) =>
        prev.map((e) => {
          if (e.id !== eventId) return e;
          return {
            ...e,
            assignments: e.assignments.filter((a) => a.employee.id !== employeeId),
          };
        })
      );

      try {
        const result = await removeVolunteer(eventId, employeeId);
        if (result.success) {
          toast.success("Volunteer removed");
        } else {
          setEvents(initialEvents);
          toast.error(result.error ?? "Failed to remove volunteer");
        }
      } catch {
        setEvents(initialEvents);
        toast.error("An error occurred");
      }
    },
    [initialEvents]
  );

  // DnD handlers — only active on desktop
  const handleDragStart = (e: DragStartEvent) => {
    isDragging.current = true;
    const emp = employees.find((x) => x.id === e.active.id);
    setActiveEmployee(emp ?? null);
  };

  const handleDragOver = (e: DragOverEvent) => {
    const overId = e.over?.id as string | undefined;
    setOverEventId(overId && events.some((ev) => ev.id === overId) ? overId : null);
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    isDragging.current = false;
    const employeeId = e.active.id as string;
    const eventId = e.over?.id as string | undefined;
    setActiveEmployee(null);
    setOverEventId(null);

    if (!eventId) return;
    if (!employees.some((emp) => emp.id === employeeId)) return;
    if (!events.some((ev) => ev.id === eventId)) return;

    await handleAssign(employeeId, eventId);
  };

  const handleEmployeeTap = (employee: Employee) => {
    setSelectedEmployee(employee);
    setTabletDialogOpen(true);
  };

  return (
    <DndContext
      sensors={isMobile ? [] : sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-[calc(100vh-56px)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-background/95 backdrop-blur shrink-0">
          <div>
            <h1 className="text-xl font-bold">Volunteer Board</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {events.length} upcoming event{events.length !== 1 ? "s" : ""}
              {!isMobile && " · Drag employees into events to assign"}
            </p>
          </div>
          {isMobile && (
            <Badge variant="secondary" className="gap-1">
              <Tablet className="h-3 w-3" />
              Tap to assign
            </Badge>
          )}
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Employee panel — desktop sidebar */}
          {!isMobile && (
            <div className="flex flex-col w-64 shrink-0 border-r bg-muted/20">
              <div className="p-3 border-b shrink-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search employees..."
                    className="pl-8 h-8 text-sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 px-1">
                  {filteredEmployees.length} employees · Drag to assign
                </p>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {filteredEmployees.map((employee) => (
                    <EmployeeCard
                      key={employee.id}
                      employee={employee}
                      isDraggable={isAdmin}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Event columns */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <div className="flex gap-4 p-4 h-full" style={{ minWidth: "max-content" }}>
            {events.length === 0 ? (
              <div className="flex flex-col items-center justify-center w-full min-w-[400px] py-20 text-center">
                <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="font-medium">No upcoming events</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create events to start assigning volunteers
                </p>
              </div>
            ) : (
              events.map((event) => (
                <EventColumn
                  key={event.id}
                  event={event}
                  employees={employees}
                  isOver={overEventId === event.id}
                  isAdmin={isAdmin}
                  isMobile={isMobile}
                  onRemoveVolunteer={(employeeId) =>
                    handleRemove(employeeId, event.id)
                  }
                />
              ))
            )}
            </div>
          </div>
        </div>

        {/* Mobile employee strip — tap an employee to open assign dialog */}
        {isMobile && (
          <div className="border-t bg-background shrink-0">
            <div className="px-3 pt-2 pb-1">
              <p className="text-xs font-medium text-muted-foreground">
                Tap an employee to assign
              </p>
            </div>
            <div className="overflow-x-auto">
              <div className="flex gap-2 px-3 pb-3" style={{ minWidth: "max-content" }}>
                {filteredEmployees.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => handleEmployeeTap(emp)}
                    className="flex items-center gap-2 rounded-lg border bg-card px-2 py-1.5 text-left shrink-0 active:scale-95 transition-transform"
                  >
                    <div
                      className="h-6 w-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                      style={{ backgroundColor: emp.avatarColor }}
                    >
                      {emp.firstName[0]}{emp.lastName[0]}
                    </div>
                    <span className="text-xs font-medium whitespace-nowrap">
                      {emp.firstName} {emp.lastName}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DragOverlay — floating card that follows cursor */}
      <DragOverlay dropAnimation={null}>
        {activeEmployee && (
          <EmployeeCard
            employee={activeEmployee}
            isDraggable={false}
            isOverlay
          />
        )}
      </DragOverlay>

      {/* Tablet two-tap dialog */}
      {isMobile && (
        <TabletAssignDialog
          open={tabletDialogOpen}
          onOpenChange={setTabletDialogOpen}
          employee={selectedEmployee}
          events={events}
          employees={employees}
          isAdmin={isAdmin}
          isAssigned={isAssigned}
          isEmployeeAvailable={isEmployeeAvailableForEvent}
          onAssign={async (eventId) => {
            if (!selectedEmployee) return;
            await handleAssign(selectedEmployee.id, eventId);
            setTabletDialogOpen(false);
          }}
        />
      )}
    </DndContext>
  );
}
