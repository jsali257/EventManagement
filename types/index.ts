// ============================================================
// Core Application Types
// Community Outreach & Volunteer Management System
// ============================================================

export type UserRole = "ADMIN" | "EMPLOYEE";

export type EmployeeStatus =
  | "AVAILABLE"
  | "BUSY"
  | "VACATION"
  | "SICK"
  | "TRAINING"
  | "INACTIVE";

export type EventStatus =
  | "UPCOMING"
  | "TODAY"
  | "COMPLETED"
  | "CANCELLED"
  | "FULL"
  | "NEEDS_VOLUNTEERS"
  | "PARTIALLY_FILLED";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export type NotificationType =
  | "ASSIGNED"
  | "REMOVED"
  | "EVENT_UPDATED"
  | "EVENT_CANCELLED"
  | "VOLUNTEER_NEEDED"
  | "ATTENDANCE_MISSING"
  | "GENERAL";

export type FileType = "PDF" | "WORD" | "EXCEL" | "IMAGE" | "OTHER";

export type ActivityAction =
  | "EVENT_CREATED"
  | "EVENT_UPDATED"
  | "EVENT_DELETED"
  | "EVENT_CANCELLED"
  | "VOLUNTEER_ASSIGNED"
  | "VOLUNTEER_REMOVED"
  | "ATTENDANCE_MARKED"
  | "ATTENDANCE_UPDATED"
  | "EMPLOYEE_CREATED"
  | "EMPLOYEE_UPDATED"
  | "EMPLOYEE_DELETED"
  | "DEPARTMENT_CREATED"
  | "DEPARTMENT_UPDATED"
  | "PHOTO_UPLOADED"
  | "ATTACHMENT_UPLOADED"
  | "ATTACHMENT_DELETED"
  | "AVAILABILITY_SET"
  | "SETTINGS_UPDATED"
  | "USER_LOGIN"
  | "USER_LOGOUT";

// ---- Database Models (mirrors Prisma schema) ----

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: UserRole;
  employeeId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  color: string;
  employeeCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string | null;
  jobTitle: string;
  departmentId: string;
  department?: Department;
  status: EmployeeStatus;
  profilePicture: string | null;
  avatarColor: string;
  userId: string | null;
  user?: User;
  volunteerHours: number;
  eventsAttended: number;
  attendanceRate: number;
  volunteerScore: number;
  lastVolunteerDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventCategory {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  createdAt: Date;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  categoryId: string;
  category?: EventCategory;
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  minVolunteers: number;
  organizerId: string;
  organizer?: Employee;
  notes: string | null;
  status: EventStatus;
  isCancelled: boolean;
  cancelledAt: Date | null;
  cancelledReason: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  assignments?: EventAssignment[];
  attachments?: Attachment[];
  photos?: EventPhoto[];
  _count?: {
    assignments: number;
    photos: number;
    attachments: number;
  };
}

export interface EventAssignment {
  id: string;
  eventId: string;
  event?: Event;
  employeeId: string;
  employee?: Employee;
  assignedById: string;
  assignedBy?: User;
  assignedAt: Date;
  notes: string | null;
}

export interface AttendanceRecord {
  id: string;
  eventId: string;
  event?: Event;
  employeeId: string;
  employee?: Employee;
  status: AttendanceStatus;
  markedById: string;
  markedAt: Date;
  notes: string | null;
}

export interface EmployeeAvailability {
  id: string;
  employeeId: string;
  employee?: Employee;
  date: Date;
  isUnavailable: boolean;
  reason: string | null;
  notes: string | null;
  createdAt: Date;
}

export interface Attachment {
  id: string;
  eventId: string | null;
  fileName: string;
  fileSize: number;
  fileType: FileType;
  mimeType: string;
  filePath: string;
  uploadedById: string;
  uploadedBy?: User;
  uploadedAt: Date;
}

export interface EventPhoto {
  id: string;
  eventId: string;
  fileName: string;
  fileSize: number;
  filePath: string;
  caption: string | null;
  uploadedById: string;
  uploadedBy?: User;
  uploadedAt: Date;
}

export interface ActivityLog {
  id: string;
  action: ActivityAction;
  entityType: string;
  entityId: string;
  description: string;
  metadata: Record<string, unknown> | null;
  userId: string;
  user?: User;
  ipAddress: string | null;
  createdAt: Date;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

export interface AppSettings {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updatedAt: Date;
}

// ---- UI / View Types ----

export interface DashboardStats {
  upcomingEvents: number;
  todayEvents: number;
  eventsNeedingVolunteers: number;
  completedEvents: number;
  totalEmployees: number;
  availableEmployees: number;
  assignedVolunteers: number;
  volunteerHours: number;
  attendanceRate: number;
}

export interface VolunteerBoardEvent extends Event {
  assignments: (EventAssignment & { employee: Employee })[];
  volunteerCount: number;
  remainingSlots: number;
  fillPercentage: number;
}

export interface EmployeeWithStats extends Employee {
  upcomingAssignments: number;
  isAvailableToday: boolean;
}

export interface SearchResult {
  type: "employee" | "event" | "department" | "category";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface ReportFilter {
  startDate?: Date;
  endDate?: Date;
  departmentId?: string;
  categoryId?: string;
  status?: EventStatus;
  employeeId?: string;
}

// ---- Form Types ----

export interface CreateEventInput {
  title: string;
  description?: string;
  categoryId: string;
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  minVolunteers: number;
  organizerId: string;
  notes?: string;
}

export interface CreateEmployeeInput {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle: string;
  departmentId: string;
  status: EmployeeStatus;
  avatarColor: string;
}

export interface SetAvailabilityInput {
  date: Date;
  isUnavailable: boolean;
  reason?: string;
  notes?: string;
}

// ---- API Response Types ----

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ---- Navigation ----

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  children?: NavItem[];
  adminOnly?: boolean;
  description?: string;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}
