import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { StatCard } from "@/components/dashboard/stat-card";
import { MonthlyChart } from "@/components/dashboard/monthly-chart";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { UpcomingEventsList } from "@/components/dashboard/upcoming-events-list";
import { TopVolunteers } from "@/components/dashboard/top-volunteers";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  getDashboardStats,
  getMonthlyChartData,
  getTopVolunteers,
  getEventsByCategory,
  getUpcomingEvents,
  getRecentNotifications,
} from "@/features/dashboard/dashboard-data";

export const metadata: Metadata = {
  title: "Dashboard",
};

export const revalidate = 60; // Revalidate every 60 seconds

async function DashboardContent() {
  const session = await auth();

  const [
    stats,
    monthlyData,
    topVolunteers,
    categoryData,
    upcomingEvents,
    recentActivity,
  ] = await Promise.all([
    getDashboardStats(),
    getMonthlyChartData(),
    getTopVolunteers(6),
    getEventsByCategory(),
    getUpcomingEvents(6),
    // Recent activity comes from the stats query
    Promise.resolve([]),
  ]);

  const statCards = [
    {
      title: "Upcoming Events",
      value: stats.upcomingEvents,
      subtitle: `${stats.todayEvents} today`,
      icon: "CalendarDays",
      iconColor: "text-blue-500",
      iconBg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Events Needing Volunteers",
      value: stats.eventsNeedingVolunteers,
      subtitle: "Open volunteer slots",
      icon: "AlertTriangle",
      iconColor: "text-red-500",
      iconBg: "bg-red-50 dark:bg-red-900/20",
    },
    {
      title: "Completed Events",
      value: stats.completedEvents,
      subtitle: "All time",
      icon: "CheckCircle",
      iconColor: "text-green-500",
      iconBg: "bg-green-50 dark:bg-green-900/20",
    },
    {
      title: "Total Employees",
      value: stats.totalEmployees,
      subtitle: `${stats.availableEmployees} available`,
      icon: "Users",
      iconColor: "text-indigo-500",
      iconBg: "bg-indigo-50 dark:bg-indigo-900/20",
    },
    {
      title: "Assigned Volunteers",
      value: stats.assignedVolunteers,
      subtitle: "Total assignments",
      icon: "UserCheck",
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
      title: "Volunteer Hours",
      value: `${stats.volunteerHours}h`,
      subtitle: "Total across all employees",
      icon: "Clock",
      iconColor: "text-amber-500",
      iconBg: "bg-amber-50 dark:bg-amber-900/20",
    },
    {
      title: "Attendance Rate",
      value: `${stats.attendanceRate}%`,
      subtitle: "Average across all events",
      icon: "Heart",
      iconColor: "text-pink-500",
      iconBg: "bg-pink-50 dark:bg-pink-900/20",
    },
    {
      title: "Available Employees",
      value: stats.availableEmployees,
      subtitle: `Out of ${stats.totalEmployees} total`,
      icon: "Activity",
      iconColor: "text-violet-500",
      iconBg: "bg-violet-50 dark:bg-violet-900/20",
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Good {getGreeting()}, {session?.user?.name?.split(" ")[0] ?? "there"} 👋
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Here&apos;s what&apos;s happening with your volunteer program today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
        {statCards.map((card, i) => (
          <StatCard key={card.title} {...card} index={i} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MonthlyChart data={monthlyData} />
        <CategoryChart data={categoryData} />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <UpcomingEventsList events={upcomingEvents} />
        </div>
        <div>
          <TopVolunteers volunteers={topVolunteers} />
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivity activities={stats.recentActivity} />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80 mt-2" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="col-span-2">
          <CardContent className="p-6">
            <Skeleton className="h-[220px]" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-[220px]" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
