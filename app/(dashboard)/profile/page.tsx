import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { ChevronLeft, Mail, Phone, Building2, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getInitials } from "@/lib/utils";
import { ChangePasswordForm } from "@/components/profile/change-password-form";

export const metadata: Metadata = { title: "My Profile" };

async function ProfileContent() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      employee: {
        include: {
          department: { select: { name: true } },
          assignments: {
            include: { event: { select: { title: true, date: true } } },
            orderBy: { event: { date: "desc" } },
            take: 5,
          },
        },
      },
    },
  });

  if (!user) redirect("/login");

  const emp = user.employee;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your account information and volunteer history
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4 flex-wrap">
            <Avatar className="h-16 w-16">
              <AvatarFallback
                className="text-white text-xl font-bold"
                style={{ backgroundColor: emp?.avatarColor ?? "#6366f1" }}
              >
                {getInitials(user.name ?? user.email ?? "U")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-semibold">
                  {emp ? `${emp.firstName} ${emp.lastName}` : user.name ?? user.email}
                </h2>
                <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                  <Shield className="mr-1 h-3 w-3" />
                  {user.role === "ADMIN" ? "Administrator" : "Employee"}
                </Badge>
              </div>
              {emp?.jobTitle && (
                <p className="text-muted-foreground text-sm mt-0.5">{emp.jobTitle}</p>
              )}
              <div className="flex flex-col gap-1.5 mt-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </div>
                {emp?.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {emp.phone}
                  </div>
                )}
                {emp?.department && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    {emp.department.name}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {emp && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{emp.eventsAttended}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Events Attended</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{Math.round(emp.volunteerHours)}h</p>
                <p className="text-xs text-muted-foreground mt-0.5">Volunteer Hours</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{Math.round(emp.attendanceRate)}%</p>
                <p className="text-xs text-muted-foreground mt-0.5">Attendance Rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent assignments */}
          {emp.assignments.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recent Events</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {emp.assignments.map((a) => (
                    <Link
                      key={a.id}
                      href={`/events/${a.eventId}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{a.event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(a.event.date), "MMMM d, yyyy")}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <ChangePasswordForm />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-36 rounded-xl" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
