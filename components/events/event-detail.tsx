"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { format, isToday, isPast } from "date-fns";
import { toast } from "sonner";
import {
  CalendarDays, MapPin, Clock, Users, Edit, XCircle,
  ChevronLeft, UserPlus, UserMinus, CheckCircle, ExternalLink,
  Paperclip, Image as ImageIcon, BarChart3, Activity,
  ChevronRight, ZoomIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  getInitials, formatTime, formatDate, formatRelativeTime, cn,
} from "@/lib/utils";
import { removeVolunteer, cancelEvent, assignVolunteer } from "@/actions/events";
import { FileUploadPanel } from "@/components/events/file-upload-panel";
import { proxyUrl } from "@/lib/proxy-url";

interface EventDetailProps {
  event: {
    id: string;
    title: string;
    description: string | null;
    date: Date;
    startTime: string;
    endTime: string;
    location: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    minVolunteers: number;
    notes: string | null;
    status: string;
    isCancelled: boolean;
    cancelledReason: string | null;
    cancelledAt: Date | null;
    createdAt: Date;
    category: { name: string; color: string; icon: string | null };
    organizer: { firstName: string; lastName: string; department: { name: string } };
    createdBy: { name: string | null; email: string };
    assignments: Array<{
      id: string;
      assignedAt: Date;
      notes: string | null;
      employee: {
        id: string;
        firstName: string;
        lastName: string;
        jobTitle: string;
        avatarColor: string;
        profilePicture: string | null;
        department: { name: string; color: string };
      };
      assignedBy: { name: string | null };
    }>;
    attendance: Array<{
      id: string;
      status: string;
      notes: string | null;
      employee: { firstName: string; lastName: string; avatarColor: string };
      markedBy: { name: string | null };
    }>;
    attachments: Array<{
      id: string;
      fileName: string;
      originalName: string;
      fileSize: number;
      fileType: string;
      filePath: string;
      uploadedAt: Date;
      uploadedBy: { name: string | null };
    }>;
    photos: Array<{
      id: string;
      fileName: string;
      originalName: string;
      filePath: string;
      caption: string | null;
      uploadedAt: Date;
      uploadedBy: { name: string | null };
    }>;
    activityLog: Array<{
      id: string;
      action: string;
      description: string;
      createdAt: Date;
      user: { name: string | null; email: string };
    }>;
  };
  isAdmin: boolean;
  currentUserId: string;
  currentEmployeeId: string | null;
  isAssigned: boolean;
}

function getEventStatusBadge(event: EventDetailProps["event"]) {
  if (event.isCancelled) return { label: "Cancelled", className: "status-cancelled" };
  const d = new Date(event.date);
  if (isToday(d)) return { label: "Today", className: "status-today" };
  if (isPast(d)) return { label: "Completed", className: "status-completed" };
  const pct = event.assignments.length / event.minVolunteers;
  if (pct === 0) return { label: "Needs Volunteers", className: "status-needs-volunteers" };
  if (pct >= 1) return { label: "Goal Met", className: "status-full" };
  return { label: "Partially Filled", className: "status-partially-filled" };
}

export function EventDetail({
  event,
  isAdmin,
  currentUserId,
  currentEmployeeId,
  isAssigned,
}: EventDetailProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const photos = event.photos;

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prevPhoto = useCallback(() =>
    setLightboxIndex((i) => (i !== null ? (i - 1 + photos.length) % photos.length : null)),
    [photos.length]);
  const nextPhoto = useCallback(() =>
    setLightboxIndex((i) => (i !== null ? (i + 1) % photos.length : null)),
    [photos.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prevPhoto();
      if (e.key === "ArrowRight") nextPhoto();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, prevPhoto, nextPhoto]);

  const status = getEventStatusBadge(event);
  const fillPct = Math.min(Math.round((event.assignments.length / event.minVolunteers) * 100), 100);
  const isPastEvent = isPast(new Date(event.date)) && !isToday(new Date(event.date));
  const goalMet = event.assignments.length >= event.minVolunteers;

  const handleRemoveVolunteer = async (employeeId: string) => {
    setRemovingId(employeeId);
    try {
      const result = await removeVolunteer(event.id, employeeId);
      if (result.success) {
        toast.success("Volunteer removed");
      } else {
        toast.error(result.error ?? "Failed to remove volunteer");
      }
    } finally {
      setRemovingId(null);
    }
  };

  const handleCancelEvent = async () => {
    setIsCancelling(true);
    try {
      const result = await cancelEvent(event.id, cancelReason);
      if (result.success) {
        toast.success("Event cancelled");
      } else {
        toast.error(result.error ?? "Failed to cancel event");
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSelfRemove = async () => {
    if (!currentEmployeeId) return;
    const result = await removeVolunteer(event.id, currentEmployeeId);
    if (result.success) {
      toast.success("You have been removed from this event");
    } else {
      toast.error(result.error ?? "Failed to remove yourself");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Back */}
      <Button variant="ghost" size="sm" asChild className="w-fit -ml-2">
        <Link href="/events">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Events
        </Link>
      </Button>

      {/* Header Card */}
      <Card className={cn(event.isCancelled && "border-destructive/30")}>
        <CardContent className="p-6">
          {event.isCancelled && (
            <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
              <p className="text-sm font-medium text-destructive">
                This event was cancelled{event.cancelledReason ? `: ${event.cancelledReason}` : ""}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge
                  variant="outline"
                  style={{
                    color: event.category.color,
                    borderColor: `${event.category.color}40`,
                  }}
                >
                  {event.category.name}
                </Badge>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                    status.className
                  )}
                >
                  {status.label}
                </span>
              </div>

              <h1 className="text-2xl font-bold">{event.title}</h1>
              {event.description && (
                <p className="mt-2 text-muted-foreground text-sm">{event.description}</p>
              )}

              <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {formatTime(event.startTime)} – {formatTime(event.endTime)}
                </span>
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {event.location}
                </span>
              </div>

              {event.address && (
                <p className="mt-1 text-xs text-muted-foreground pl-6">
                  {event.address}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {!isPastEvent && !event.isCancelled && isAssigned === false && currentEmployeeId && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    if (!currentEmployeeId) return;
                    const result = await assignVolunteer(event.id, currentEmployeeId);
                    if (result.success) toast.success("You've volunteered for this event!");
                    else toast.error(result.error ?? "Failed to volunteer");
                  }}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Volunteer
                </Button>
              )}
              {isAssigned && !isPastEvent && (
                <Button size="sm" variant="outline" onClick={handleSelfRemove}>
                  <UserMinus className="mr-2 h-4 w-4" />
                  Remove Myself
                </Button>
              )}
              {isAdmin && !event.isCancelled && (
                <>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/events/${event.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel Event
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Event?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will cancel the event and notify all assigned volunteers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <textarea
                        className="w-full rounded-md border bg-background p-2 text-sm min-h-[80px] mt-2"
                        placeholder="Reason for cancellation (optional)..."
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                      />
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Event</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleCancelEvent}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Cancel Event
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </div>

          <Separator className="my-4" />

          {/* Volunteer progress */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                <strong className="text-foreground">{event.assignments.length}</strong>
                {" "}signed up · {event.minVolunteers} needed
              </span>
            </div>
            <Progress
              value={Math.min(fillPct, 100)}
              className={cn(
                "flex-1 h-2",
                fillPct === 0 && "[&>div]:bg-red-500",
                fillPct > 0 && fillPct < 100 && "[&>div]:bg-yellow-500",
                fillPct >= 100 && "[&>div]:bg-green-500"
              )}
            />
            <span className="text-sm font-medium">{Math.min(fillPct, 100)}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="volunteers">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="volunteers">
            Volunteers ({event.assignments.length})
          </TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          {isPastEvent && (
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
          )}
          {(isAdmin || event.attachments.length > 0) && (
            <TabsTrigger value="attachments">
              Attachments ({event.attachments.length})
            </TabsTrigger>
          )}
          {(isAdmin || event.photos.length > 0) && (
            <TabsTrigger value="photos">Photos ({event.photos.length})</TabsTrigger>
          )}
          {(event.latitude && event.longitude) && (
            <TabsTrigger value="map">Map</TabsTrigger>
          )}
        </TabsList>

        {/* Volunteers Tab */}
        <TabsContent value="volunteers" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assigned Volunteers</CardTitle>
            </CardHeader>
            <CardContent>
              {event.assignments.length === 0 ? (
                <div className="text-center py-10">
                  <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">
                    No volunteers assigned yet
                  </p>
                  {isAdmin && !event.isCancelled && !isPastEvent && (
                    <Button className="mt-4" asChild>
                      <Link href="/volunteer-board">
                        Go to Volunteer Board
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {event.assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center gap-3 rounded-lg p-3 border"
                    >
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback
                          className="text-white text-sm font-semibold"
                          style={{ backgroundColor: assignment.employee.avatarColor }}
                        >
                          {getInitials(
                            `${assignment.employee.firstName} ${assignment.employee.lastName}`
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/employees/${assignment.employee.id}`}
                          className="font-medium text-sm hover:text-primary transition-colors"
                        >
                          {assignment.employee.firstName} {assignment.employee.lastName}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          {assignment.employee.jobTitle} ·{" "}
                          {assignment.employee.department.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Assigned {formatRelativeTime(assignment.assignedAt)}
                          {assignment.assignedBy.name && (
                            <> by {assignment.assignedBy.name}</>
                          )}
                        </div>
                      </div>
                      {isAdmin && !event.isCancelled && !isPastEvent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 text-destructive hover:text-destructive"
                          disabled={removingId === assignment.employee.id}
                          onClick={() => handleRemoveVolunteer(assignment.employee.id)}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Event Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                <div className="space-y-4">
                  {event.activityLog.length === 0 ? (
                    <p className="text-sm text-muted-foreground pl-10 py-4">
                      No activity recorded yet
                    </p>
                  ) : (
                    event.activityLog.map((log) => (
                      <div key={log.id} className="flex gap-4 pl-1">
                        <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-background">
                          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className="text-sm">{log.description}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">
                              {log.user.name ?? log.user.email}
                            </span>
                            <span className="text-xs text-muted-foreground/50">·</span>
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeTime(log.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Attendance</CardTitle>
              {isAdmin && (
                <Button size="sm" asChild>
                  <Link href={`/attendance/${event.id}`}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark Attendance
                  </Link>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {event.attendance.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No attendance records yet
                </p>
              ) : (
                <div className="space-y-2">
                  {event.attendance.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center gap-3 rounded-lg p-3 bg-muted/30"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback
                          className="text-white text-xs"
                          style={{ backgroundColor: record.employee.avatarColor }}
                        >
                          {getInitials(
                            `${record.employee.firstName} ${record.employee.lastName}`
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {record.employee.firstName} {record.employee.lastName}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          record.status === "PRESENT" && "text-green-600 border-green-300",
                          record.status === "ABSENT" && "text-red-600 border-red-300",
                          record.status === "LATE" && "text-yellow-600 border-yellow-300",
                          record.status === "EXCUSED" && "text-blue-600 border-blue-300"
                        )}
                      >
                        {record.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attachments Tab */}
        <TabsContent value="attachments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Attachments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isAdmin && <FileUploadPanel eventId={event.id} type="attachment" />}
              <div className="space-y-2">
                {event.attachments.map((file) => (
                  <a
                    key={file.id}
                    href={file.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg p-3 border hover:bg-muted/40 transition-colors"
                  >
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.originalName}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.fileType} · Uploaded by {file.uploadedBy.name}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Event Photos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isAdmin && <FileUploadPanel eventId={event.id} type="photo" />}

              {photos.length === 0 && !isAdmin && (
                <p className="text-sm text-muted-foreground text-center py-6">No photos yet.</p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => openLightbox(index)}
                    className="group relative aspect-square overflow-hidden rounded-lg border bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <img
                      src={proxyUrl(photo.filePath)}
                      alt={photo.caption ?? photo.originalName}
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
                      <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                    {photo.caption && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <p className="text-xs text-white truncate">{photo.caption}</p>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lightbox */}
        {lightboxIndex !== null && photos[lightboxIndex] && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
            onClick={closeLightbox}
          >
            {/* Close */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 rounded-full bg-white/10 hover:bg-white/20 p-2 text-white transition-colors"
            >
              <XCircle className="h-6 w-6" />
            </button>

            {/* Counter */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
              {lightboxIndex + 1} / {photos.length}
            </div>

            {/* Prev */}
            {photos.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                className="absolute left-4 rounded-full bg-white/10 hover:bg-white/20 p-3 text-white transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Image */}
            <div
              className="max-h-[85vh] max-w-[85vw] flex flex-col items-center gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={proxyUrl(photos[lightboxIndex].filePath)}
                alt={photos[lightboxIndex].caption ?? photos[lightboxIndex].originalName}
                className="max-h-[78vh] max-w-full rounded-lg object-contain shadow-2xl"
              />
              {photos[lightboxIndex].caption && (
                <p className="text-white/80 text-sm text-center">
                  {photos[lightboxIndex].caption}
                </p>
              )}
              <a
                href={photos[lightboxIndex].filePath}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-white/50 hover:text-white/80 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3 w-3" />
                Open full size
              </a>
            </div>

            {/* Next */}
            {photos.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                className="absolute right-4 rounded-full bg-white/10 hover:bg-white/20 p-3 text-white transition-colors"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>
        )}

        {/* Map Tab */}
        {event.latitude && event.longitude && (
          <TabsContent value="map" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Location Map</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg overflow-hidden border aspect-video bg-muted flex items-center justify-center">
                  <div className="text-center p-4">
                    <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium">{event.location}</p>
                    {event.address && (
                      <p className="text-xs text-muted-foreground">{event.address}</p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      asChild
                    >
                      <a
                        href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open in Google Maps
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
