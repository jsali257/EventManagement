import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isFuture, isPast } from "date-fns";
import type { EventStatus, EmployeeStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---- Date formatting ----

export function formatDate(date: Date | string, pattern = "MMM d, yyyy") {
  return format(new Date(date), pattern);
}

export function formatDateTime(date: Date | string) {
  return format(new Date(date), "MMM d, yyyy 'at' h:mm a");
}

export function formatTime(time: string) {
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${suffix}`;
}

export function formatRelativeTime(date: Date | string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDuration(startTime: string, endTime: string): string {
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  const diff = endMinutes - startMinutes;
  if (diff <= 0) return "0 min";
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

// ---- Event status ----

export function getEventStatus(
  date: Date | string,
  isCancelled: boolean,
  assignmentCount: number,
  minVolunteers: number
): EventStatus {
  if (isCancelled) return "CANCELLED";
  const eventDate = new Date(date);
  if (isPast(eventDate) && !isToday(eventDate)) return "COMPLETED";
  if (isToday(eventDate)) return "TODAY";
  if (!isFuture(eventDate)) return "COMPLETED";
  if (assignmentCount === 0) return "NEEDS_VOLUNTEERS";
  if (assignmentCount >= minVolunteers) return "FULL";
  return "PARTIALLY_FILLED";
}

export function getEventStatusLabel(status: EventStatus): string {
  const labels: Record<EventStatus, string> = {
    UPCOMING: "Upcoming",
    TODAY: "Today",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    FULL: "Goal Met",
    NEEDS_VOLUNTEERS: "Needs Volunteers",
    PARTIALLY_FILLED: "Partially Filled",
  };
  return labels[status];
}

export function getEventStatusColor(status: EventStatus): string {
  const colors: Record<EventStatus, string> = {
    NEEDS_VOLUNTEERS: "status-needs-volunteers",
    PARTIALLY_FILLED: "status-partially-filled",
    FULL: "status-full",
    COMPLETED: "status-completed",
    CANCELLED: "status-cancelled",
    TODAY: "status-today",
    UPCOMING: "status-partially-filled",
  };
  return colors[status];
}

export function getEventStatusBadgeVariant(
  status: EventStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "NEEDS_VOLUNTEERS":
      return "destructive";
    case "CANCELLED":
      return "secondary";
    case "FULL":
    case "COMPLETED":
      return "default";
    default:
      return "outline";
  }
}

// ---- Employee status ----

export function getEmployeeStatusLabel(status: EmployeeStatus): string {
  const labels: Record<EmployeeStatus, string> = {
    AVAILABLE: "Available",
    BUSY: "Busy",
    VACATION: "Vacation",
    SICK: "Sick",
    TRAINING: "Training",
    INACTIVE: "Inactive",
  };
  return labels[status];
}

export function getEmployeeStatusColor(status: EmployeeStatus): string {
  const colors: Record<EmployeeStatus, string> = {
    AVAILABLE: "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400",
    BUSY: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400",
    VACATION: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",
    SICK: "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400",
    TRAINING: "text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400",
    INACTIVE: "text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400",
  };
  return colors[status];
}

export function isEmployeeAvailable(status: EmployeeStatus): boolean {
  return status === "AVAILABLE";
}

// ---- String utilities ----

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}…`;
}

// ---- Number utilities ----

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ---- Color utilities ----

export const AVATAR_COLORS = [
  "#3B82F6", // blue
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#EF4444", // red
  "#F59E0B", // amber
  "#10B981", // emerald
  "#06B6D4", // cyan
  "#6366F1", // indigo
  "#F97316", // orange
  "#84CC16", // lime
  "#14B8A6", // teal
  "#A855F7", // purple
];

export function getRandomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

// ---- URL utilities ----

export function buildSearchParams(
  params: Record<string, string | number | boolean | undefined | null>
): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== "") {
      searchParams.set(key, String(value));
    }
  }
  const str = searchParams.toString();
  return str ? `?${str}` : "";
}

// ---- Volunteer score ----

export function calculateVolunteerScore(
  eventsAttended: number,
  attendanceRate: number,
  volunteerHours: number
): number {
  // Weighted: 40% attendance rate, 40% events attended (capped at 50), 20% hours (capped at 200h)
  const attendanceScore = attendanceRate * 0.4;
  const eventsScore = Math.min(eventsAttended / 50, 1) * 100 * 0.4;
  const hoursScore = Math.min(volunteerHours / 200, 1) * 100 * 0.2;
  return Math.round(attendanceScore + eventsScore + hoursScore);
}
