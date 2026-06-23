"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setEmployeeAvailability, removeEmployeeAvailability } from "@/actions/employees";
import { cn } from "@/lib/utils";

interface Availability {
  id: string;
  date: Date;
  isUnavailable: boolean;
  reason: string | null;
}

interface AvailabilityCalendarProps {
  employeeId: string;
  availability: Availability[];
  canEdit: boolean;
}

const reasons = [
  "Vacation",
  "Personal",
  "Medical",
  "Training",
  "Holiday",
  "Other",
];

export function AvailabilityCalendar({
  employeeId,
  availability,
  canEdit,
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reason, setReason] = useState("Vacation");
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad start
  const startPad = monthStart.getDay(); // 0 = Sunday
  const emptyDays = Array.from({ length: startPad });

  const getAvailabilityForDate = (date: Date) =>
    availability.find((a) => isSameDay(new Date(a.date), date));

  const handleDayClick = (date: Date) => {
    if (!canEdit) return;
    const past = date < new Date(new Date().setHours(0, 0, 0, 0));
    if (past) return;
    setSelectedDate(date);
    setDialogOpen(true);
  };

  const handleSetUnavailable = async () => {
    if (!selectedDate) return;
    setIsSubmitting(true);
    try {
      const result = await setEmployeeAvailability({
        employeeId,
        date: format(selectedDate, "yyyy-MM-dd"),
        isUnavailable: true,
        reason: reason === "Other" ? customReason : reason,
      });
      if (result.success) {
        toast.success("Availability saved");
        setDialogOpen(false);
      } else {
        toast.error(result.error ?? "Failed to save");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (date: Date) => {
    const result = await removeEmployeeAvailability(
      employeeId,
      format(date, "yyyy-MM-dd")
    );
    if (result.success) {
      toast.success("Availability removed");
    } else {
      toast.error(result.error ?? "Failed to remove");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Availability Calendar</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  setCurrentMonth(
                    new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
                  )
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {format(currentMonth, "MMMM yyyy")}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  setCurrentMonth(
                    new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
                  )
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day labels */}
          <div className="grid grid-cols-7 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="text-center text-xs font-medium text-muted-foreground py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {emptyDays.map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {days.map((day) => {
              const avail = getAvailabilityForDate(day);
              const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
              const isUnavailable = avail?.isUnavailable;

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  disabled={!canEdit || isPast}
                  className={cn(
                    "relative aspect-square flex flex-col items-center justify-center rounded-md text-xs transition-colors",
                    isPast && "opacity-40 cursor-default",
                    !isPast && canEdit && "hover:bg-muted cursor-pointer",
                    isToday(day) && "ring-1 ring-primary",
                    isUnavailable &&
                      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  )}
                  title={avail?.reason ?? undefined}
                >
                  <span className="font-medium">{format(day, "d")}</span>
                  {isUnavailable && (
                    <span className="text-[9px] leading-none mt-0.5 truncate max-w-full px-0.5">
                      {avail?.reason ?? "Unavail."}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {canEdit && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Click a future date to mark yourself unavailable
            </p>
          )}
        </CardContent>
      </Card>

      {/* Upcoming unavailability list */}
      {availability.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Unavailable Dates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {availability
                .filter((a) => a.isUnavailable)
                .map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-lg p-2.5 bg-red-50 dark:bg-red-900/20"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {format(new Date(a.date), "EEEE, MMMM d, yyyy")}
                      </p>
                      {a.reason && (
                        <p className="text-xs text-muted-foreground">{a.reason}</p>
                      )}
                    </div>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleRemove(new Date(a.date))}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Set unavailable dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Mark Unavailable — {selectedDate && format(selectedDate, "MMMM d, yyyy")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Reason</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reasons.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {reason === "Other" && (
              <div className="space-y-2">
                <Label>Custom Reason</Label>
                <Input
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Enter reason..."
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSetUnavailable}
              disabled={isSubmitting}
            >
              Mark Unavailable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
