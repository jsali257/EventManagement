"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle, XCircle, AlertCircle, Clock,
  Save, Loader2, Info, RotateCcw, UserPlus, Search, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { markBulkAttendance, addWalkInAttendee } from "@/actions/attendance";
import { getInitials, cn, formatDate, formatTime } from "@/lib/utils";

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

interface AttendanceRecord {
  employeeId: string;
  status: AttendanceStatus;
  notes?: string;
}

interface TrackerEmployee {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  avatarColor: string;
  department: { name: string };
}

interface ExistingAttendance {
  employeeId: string;
  status: string;
  notes: string | null;
}

interface AttendanceTrackerProps {
  event: {
    id: string;
    title: string;
    date: Date;
    startTime: string;
    endTime: string;
    location: string;
    assignments: Array<{ employee: TrackerEmployee }>;
    attendance: ExistingAttendance[];
  };
  availableEmployees: TrackerEmployee[];
}

const exceptionConfig = {
  ABSENT: {
    label: "Absent",
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-300 dark:border-red-700",
    badge: "border-red-300 text-red-600",
  },
  LATE: {
    label: "Late",
    icon: Clock,
    color: "text-yellow-600",
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    border: "border-yellow-300 dark:border-yellow-700",
    badge: "border-yellow-300 text-yellow-600",
  },
  EXCUSED: {
    label: "Excused",
    icon: AlertCircle,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-300 dark:border-blue-700",
    badge: "border-blue-300 text-blue-600",
  },
} as const;

export function AttendanceTracker({ event, availableEmployees }: AttendanceTrackerProps) {
  const router = useRouter();

  const [records, setRecords] = useState<Map<string, AttendanceRecord>>(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const assignment of event.assignments) {
      const existing = event.attendance.find(
        (a) => a.employeeId === assignment.employee.id
      );
      map.set(assignment.employee.id, {
        employeeId: assignment.employee.id,
        status: (existing?.status as AttendanceStatus) ?? "PRESENT",
        notes: existing?.notes ?? undefined,
      });
    }
    return map;
  });

  const [isSaving, setIsSaving] = useState(false);

  // Walk-in state
  const [walkInSearch, setWalkInSearch] = useState("");
  const [walkInEmployees, setWalkInEmployees] = useState<TrackerEmployee[]>([]);
  const [addingWalkIn, setAddingWalkIn] = useState<string | null>(null);
  const [unassigned, setUnassigned] = useState<TrackerEmployee[]>(availableEmployees);

  const filteredUnassigned = useMemo(() => {
    const q = walkInSearch.toLowerCase();
    if (!q) return unassigned;
    return unassigned.filter(
      (e) =>
        e.firstName.toLowerCase().includes(q) ||
        e.lastName.toLowerCase().includes(q) ||
        e.jobTitle.toLowerCase().includes(q) ||
        e.department.name.toLowerCase().includes(q)
    );
  }, [unassigned, walkInSearch]);

  const handleAddWalkIn = async (employee: TrackerEmployee) => {
    setAddingWalkIn(employee.id);
    try {
      const result = await addWalkInAttendee(event.id, employee.id);
      if (result.success) {
        // Add to local records as PRESENT
        setRecords((prev) => {
          const next = new Map(prev);
          next.set(employee.id, { employeeId: employee.id, status: "PRESENT" });
          return next;
        });
        // Add to the displayed walk-in employees list
        setWalkInEmployees((prev) => [...prev, employee]);
        // Remove from unassigned pool
        setUnassigned((prev) => prev.filter((e) => e.id !== employee.id));
        setWalkInSearch("");
        toast.success(`${employee.firstName} ${employee.lastName} added as walk-in`);
      } else {
        toast.error(result.error ?? "Failed to add walk-in");
      }
    } finally {
      setAddingWalkIn(null);
    }
  };

  const updateRecord = (employeeId: string, updates: Partial<AttendanceRecord>) => {
    setRecords((prev) => {
      const next = new Map(prev);
      const existing = next.get(employeeId) ?? { employeeId, status: "PRESENT" as AttendanceStatus };
      next.set(employeeId, { ...existing, ...updates });
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await markBulkAttendance(event.id, Array.from(records.values()));
      if (result.success) {
        toast.success("Attendance saved");
        router.push(`/events/${event.id}`);
      } else {
        toast.error(result.error ?? "Failed to save attendance");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Combine original assignments + walk-ins for display
  const allEmployees = useMemo(() => {
    const assigned = event.assignments.map((a) => a.employee);
    return [...assigned, ...walkInEmployees];
  }, [event.assignments, walkInEmployees]);

  const allRecords = Array.from(records.values());
  const presentCount = allRecords.filter((r) => r.status === "PRESENT").length;
  const exceptions = allRecords.filter((r) => r.status !== "PRESENT");

  if (event.assignments.length === 0 && walkInEmployees.length === 0 && unassigned.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No volunteers assigned to this event.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Event info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>{formatDate(event.date, "EEEE, MMMM d, yyyy")}</span>
            <span>·</span>
            <span>{formatTime(event.startTime)} – {formatTime(event.endTime)}</span>
            <span>·</span>
            <span>{event.location}</span>
          </div>
        </CardContent>
      </Card>

      {/* Info banner */}
      <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <span>
          All volunteers are marked <strong>Present</strong> by default.
          Only update the records below if someone was absent, late, or excused.
        </span>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="border-green-300 text-green-600 gap-1">
          <CheckCircle className="h-3 w-3" />
          Present: {presentCount}
        </Badge>
        {exceptions.map((r) => {
          const config = exceptionConfig[r.status as keyof typeof exceptionConfig];
          if (!config) return null;
          return (
            <Badge key={r.status} variant="outline" className={cn("gap-1", config.badge)}>
              <config.icon className="h-3 w-3" />
              {config.label}: {allRecords.filter((x) => x.status === r.status).length}
            </Badge>
          );
        })}
        {walkInEmployees.length > 0 && (
          <Badge variant="outline" className="gap-1 border-purple-300 text-purple-600">
            <UserPlus className="h-3 w-3" />
            Walk-ins: {walkInEmployees.length}
          </Badge>
        )}
        <span className="text-sm text-muted-foreground ml-auto">
          {allEmployees.length} total
        </span>
      </div>

      {/* Volunteer rows */}
      <div className="space-y-2">
        {allEmployees.map((employee) => {
          const record = records.get(employee.id) ?? {
            employeeId: employee.id,
            status: "PRESENT" as AttendanceStatus,
          };
          const isPresent = record.status === "PRESENT";
          const exConf = !isPresent
            ? exceptionConfig[record.status as keyof typeof exceptionConfig]
            : null;

          return (
            <Card
              key={employee.id}
              className={cn(
                "transition-all border-l-4",
                isPresent
                  ? "border-l-green-400"
                  : exConf?.border ?? "border-l-border"
              )}
            >
              <CardContent className={cn("p-4", !isPresent && exConf?.bg)}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback
                      className="text-white text-sm font-semibold"
                      style={{ backgroundColor: employee.avatarColor }}
                    >
                      {getInitials(`${employee.firstName} ${employee.lastName}`)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      {employee.firstName} {employee.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {employee.jobTitle} · {employee.department.name}
                    </p>
                  </div>

                  {/* Status controls */}
                  <div className="flex items-center gap-2 flex-wrap sm:shrink-0">
                    {isPresent ? (
                      <>
                        <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Present
                        </span>
                        <span className="text-muted-foreground/40 text-xs">— mark as:</span>
                        {(Object.entries(exceptionConfig) as [keyof typeof exceptionConfig, typeof exceptionConfig.ABSENT][]).map(
                          ([status, conf]) => (
                            <button
                              key={status}
                              onClick={() => updateRecord(employee.id, { status })}
                              className={cn(
                                "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium border transition-all",
                                "border-border text-muted-foreground hover:border-muted-foreground",
                                `hover:${conf.color}`
                              )}
                            >
                              <conf.icon className="h-3 w-3" />
                              {conf.label}
                            </button>
                          )
                        )}
                      </>
                    ) : (
                      <>
                        {exConf && (
                          <span className={cn("flex items-center gap-1 text-xs font-semibold", exConf.color)}>
                            <exConf.icon className="h-3.5 w-3.5" />
                            {exConf.label}
                          </span>
                        )}
                        {(Object.entries(exceptionConfig) as [keyof typeof exceptionConfig, typeof exceptionConfig.ABSENT][]).map(
                          ([status, conf]) =>
                            status !== record.status ? (
                              <button
                                key={status}
                                onClick={() => updateRecord(employee.id, { status })}
                                className={cn(
                                  "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium border transition-all",
                                  "border-border text-muted-foreground hover:border-muted-foreground"
                                )}
                              >
                                <conf.icon className="h-3 w-3" />
                                {conf.label}
                              </button>
                            ) : null
                        )}
                        <button
                          onClick={() => updateRecord(employee.id, { status: "PRESENT", notes: undefined })}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium border border-green-300 text-green-600 hover:bg-green-50 transition-all"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Reset
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Notes — only show for exceptions */}
                {!isPresent && (
                  <div className="mt-3">
                    <Textarea
                      placeholder="Add a note (optional)..."
                      rows={1}
                      className="text-xs min-h-0 resize-none"
                      value={record.notes ?? ""}
                      onChange={(e) =>
                        updateRecord(employee.id, { notes: e.target.value || undefined })
                      }
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Walk-in attendee section */}
      {unassigned.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-purple-600" />
              Add Walk-in Attendee
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Add someone who attended but wasn&apos;t originally on the list.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, title, or department..."
                className="pl-8 text-sm"
                value={walkInSearch}
                onChange={(e) => setWalkInSearch(e.target.value)}
              />
              {walkInSearch && (
                <button
                  onClick={() => setWalkInSearch("")}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {walkInSearch && filteredUnassigned.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                No employees found matching &quot;{walkInSearch}&quot;
              </p>
            )}

            {walkInSearch && filteredUnassigned.length > 0 && (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {filteredUnassigned.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center gap-3 rounded-md border px-3 py-2 hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarFallback
                        className="text-white text-xs font-semibold"
                        style={{ backgroundColor: employee.avatarColor }}
                      >
                        {getInitials(`${employee.firstName} ${employee.lastName}`)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {employee.firstName} {employee.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {employee.jobTitle} · {employee.department.name}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 h-7 text-xs border-purple-300 text-purple-600 hover:bg-purple-50"
                      disabled={addingWalkIn === employee.id}
                      onClick={() => handleAddWalkIn(employee)}
                    >
                      {addingWalkIn === employee.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="h-3 w-3 mr-1" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Save */}
      <Button size="lg" className="w-full" onClick={handleSave} disabled={isSaving}>
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Save Attendance
          </>
        )}
      </Button>
    </div>
  );
}
