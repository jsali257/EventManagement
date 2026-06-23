"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Mail,
  Phone,
  Building2,
  Briefcase,
  CalendarDays,
  Clock,
  Heart,
  Star,
  Edit,
  Calendar,
  ChevronLeft,
  Award,
  CheckCircle,
  XCircle,
  AlertCircle,
  KeyRound,
  Loader2,
  Shield,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  getInitials,
  getEmployeeStatusColor,
  getEmployeeStatusLabel,
  formatDate,
  formatTime,
  cn,
} from "@/lib/utils";
import { AvailabilityCalendar } from "./availability-calendar";
import { toast } from "sonner";
import { resetEmployeePassword, setEmployeeRole } from "@/actions/password";
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

interface EmployeeProfileProps {
  employee: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    jobTitle: string;
    status: string;
    profilePicture: string | null;
    avatarColor: string;
    notes: string | null;
    eventsAttended: number;
    volunteerHours: number;
    attendanceRate: number;
    volunteerScore: number;
    lastVolunteerDate: Date | null;
    department: { id: string; name: string; color: string };
    assignments: Array<{
      id: string;
      assignedAt: Date;
      event: {
        id: string;
        title: string;
        date: Date;
        startTime: string;
        location: string;
        category: { name: string; color: string };
      };
    }>;
    attendance: Array<{
      id: string;
      status: string;
      event: { title: string; date: Date };
    }>;
    availability: Array<{
      id: string;
      date: Date;
      isUnavailable: boolean;
      reason: string | null;
    }>;
  };
  upcomingAssignments: Array<{
    id: string;
    event: {
      id: string;
      title: string;
      date: Date;
      startTime: string;
      location: string;
    };
  }>;
  isAdmin: boolean;
  isOwnProfile: boolean;
  userRole: "ADMIN" | "EMPLOYEE";
}

const attendanceIcons = {
  PRESENT: { icon: CheckCircle, color: "text-green-500" },
  ABSENT: { icon: XCircle, color: "text-red-500" },
  LATE: { icon: AlertCircle, color: "text-yellow-500" },
  EXCUSED: { icon: AlertCircle, color: "text-blue-500" },
};

export function EmployeeProfile({
  employee,
  upcomingAssignments,
  isAdmin,
  isOwnProfile,
  userRole,
}: EmployeeProfileProps) {
  const canEdit = isAdmin || isOwnProfile;
  const [isPending, startTransition] = useTransition();
  const isCurrentlyAdmin = userRole === "ADMIN";

  const handleResetPassword = () => {
    startTransition(async () => {
      const result = await resetEmployeePassword(employee.id);
      if (result.success) {
        toast.success("Password reset to TempPass@123!");
      } else {
        toast.error(result.error ?? "Failed to reset password");
      }
    });
  };

  const handleRoleToggle = () => {
    startTransition(async () => {
      const newRole = isCurrentlyAdmin ? "EMPLOYEE" : "ADMIN";
      const result = await setEmployeeRole(employee.id, newRole);
      if (result.success) {
        toast.success(
          newRole === "ADMIN"
            ? `${employee.firstName} is now an Administrator`
            : `${employee.firstName} is now an Employee`
        );
      } else {
        toast.error(result.error ?? "Failed to update role");
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild className="w-fit -ml-2">
        <Link href="/employees">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Employees
        </Link>
      </Button>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <Avatar className="h-20 w-20 shrink-0">
              <AvatarImage
                src={employee.profilePicture ?? undefined}
                alt={`${employee.firstName} ${employee.lastName}`}
              />
              <AvatarFallback
                className="text-2xl font-bold text-white"
                style={{ backgroundColor: employee.avatarColor }}
              >
                {getInitials(`${employee.firstName} ${employee.lastName}`)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold">
                    {employee.firstName} {employee.lastName}
                  </h1>
                  <p className="text-muted-foreground">{employee.jobTitle}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge
                      variant="outline"
                      style={{
                        color: employee.department.color,
                        borderColor: `${employee.department.color}40`,
                      }}
                    >
                      {employee.department.name}
                    </Badge>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        getEmployeeStatusColor(employee.status as never)
                      )}
                    >
                      {getEmployeeStatusLabel(employee.status as never)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      #{employee.employeeId}
                    </span>
                  </div>
                </div>

                {canEdit && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/employees/${employee.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Profile
                      </Link>
                    </Button>
                    {isAdmin && (
                      <>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" disabled={isPending}>
                              {isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <KeyRound className="mr-2 h-4 w-4" />
                              )}
                              Reset Password
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Reset Password?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will reset{" "}
                                <strong>
                                  {employee.firstName} {employee.lastName}
                                </strong>
                                &apos;s password to <strong>TempPass@123!</strong>. They will need to
                                change it on their next login.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleResetPassword}>
                                Reset Password
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        {!isOwnProfile && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant={isCurrentlyAdmin ? "destructive" : "outline"}
                                size="sm"
                                disabled={isPending}
                              >
                                {isPending ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Shield className="mr-2 h-4 w-4" />
                                )}
                                {isCurrentlyAdmin ? "Remove Admin" : "Make Admin"}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {isCurrentlyAdmin ? "Remove Admin Role?" : "Grant Admin Role?"}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {isCurrentlyAdmin
                                    ? `${employee.firstName} ${employee.lastName} will lose admin access and become a regular employee.`
                                    : `${employee.firstName} ${employee.lastName} will gain full admin access — they can manage employees, events, and settings.`}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleRoleToggle}>
                                  {isCurrentlyAdmin ? "Remove Admin" : "Make Admin"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* Contact info */}
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <a
                  href={`mailto:${employee.email}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  {employee.email}
                </a>
                {employee.phone && (
                  <a
                    href={`tel:${employee.phone}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    {employee.phone}
                  </a>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: "Events Attended",
            value: employee.eventsAttended,
            icon: CalendarDays,
            color: "text-blue-500",
            bg: "bg-blue-50 dark:bg-blue-900/20",
          },
          {
            label: "Volunteer Hours",
            value: `${Math.round(employee.volunteerHours)}h`,
            icon: Clock,
            color: "text-amber-500",
            bg: "bg-amber-50 dark:bg-amber-900/20",
          },
          {
            label: "Attendance Rate",
            value: `${Math.round(employee.attendanceRate)}%`,
            icon: Heart,
            color: "text-pink-500",
            bg: "bg-pink-50 dark:bg-pink-900/20",
          },
          {
            label: "Volunteer Score",
            value: employee.volunteerScore,
            icon: Star,
            color: "text-violet-500",
            bg: "bg-violet-50 dark:bg-violet-900/20",
          },
        ].map((stat) => (
          <Card key={stat.label} className="card-hover">
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  stat.bg
                )}
              >
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
              <div>
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList>
          <TabsTrigger value="history">Volunteer History</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
        </TabsList>

        {/* Volunteer History */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Event History</CardTitle>
            </CardHeader>
            <CardContent>
              {employee.assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No events attended yet
                </p>
              ) : (
                <div className="space-y-3">
                  {employee.assignments.map((assignment) => (
                    <Link
                      key={assignment.id}
                      href={`/events/${assignment.event.id}`}
                      className="flex items-center gap-3 rounded-lg p-3 hover:bg-muted/40 transition-colors"
                    >
                      <div
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: assignment.event.category.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {assignment.event.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(assignment.event.date)} · {assignment.event.location}
                        </p>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {assignment.event.category.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upcoming Events */}
        <TabsContent value="upcoming" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No upcoming assignments
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingAssignments.map((assignment) => (
                    <Link
                      key={assignment.id}
                      href={`/events/${assignment.event.id}`}
                      className="flex items-center gap-3 rounded-lg p-3 hover:bg-muted/40 transition-colors border"
                    >
                      <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {assignment.event.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(assignment.event.date)} · {formatTime(assignment.event.startTime)} · {assignment.event.location}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance */}
        <TabsContent value="attendance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Attendance Records</CardTitle>
            </CardHeader>
            <CardContent>
              {employee.attendance.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No attendance records
                </p>
              ) : (
                <div className="space-y-3">
                  {employee.attendance.map((record) => {
                    const config = attendanceIcons[record.status as keyof typeof attendanceIcons];
                    return (
                      <div
                        key={record.id}
                        className="flex items-center gap-3 rounded-lg p-3 bg-muted/30"
                      >
                        <config.icon className={cn("h-4 w-4 shrink-0", config.color)} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {record.event.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(record.event.date)}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn("text-xs", config.color)}
                        >
                          {record.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Availability */}
        <TabsContent value="availability" className="mt-4">
          <AvailabilityCalendar
            employeeId={employee.id}
            availability={employee.availability}
            canEdit={canEdit}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
