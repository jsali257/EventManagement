import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, isToday, isFuture, isPast, startOfDay, endOfDay } from "date-fns";

export async function getDashboardStats() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const [
    totalEvents,
    todayEvents,
    upcomingEvents,
    completedEvents,
    cancelledEvents,
    totalEmployees,
    availableEmployees,
    totalAssignments,
    attendanceRecords,
    recentActivity,
  ] = await Promise.all([
    prisma.event.count({ where: { isCancelled: false } }),
    prisma.event.count({
      where: {
        date: { gte: todayStart, lte: todayEnd },
        isCancelled: false,
      },
    }),
    prisma.event.count({
      where: {
        date: { gt: todayEnd },
        isCancelled: false,
      },
    }),
    prisma.event.count({
      where: {
        date: { lt: todayStart },
        isCancelled: false,
      },
    }),
    prisma.event.count({ where: { isCancelled: true } }),
    prisma.employee.count({ where: { isActive: true } }),
    prisma.employee.count({ where: { status: "AVAILABLE", isActive: true } }),
    prisma.eventAssignment.count(),
    prisma.attendanceRecord.findMany({
      select: { status: true },
    }),
    prisma.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  // Calculate attendance rate
  const presentCount = attendanceRecords.filter(
    (r) => r.status === "PRESENT" || r.status === "LATE"
  ).length;
  const attendanceRate =
    attendanceRecords.length > 0
      ? (presentCount / attendanceRecords.length) * 100
      : 0;

  // Events needing volunteers (upcoming with 0 assignments or less than max)
  const eventsNeedingVolunteers = await prisma.event.count({
    where: {
      date: { gte: todayStart },
      isCancelled: false,
      assignments: {
        none: {},
      },
    },
  });

  // Volunteer hours (sum from employee table)
  const volunteerHoursResult = await prisma.employee.aggregate({
    _sum: { volunteerHours: true },
  });
  const totalVolunteerHours = volunteerHoursResult._sum.volunteerHours ?? 0;

  return {
    totalEvents,
    todayEvents,
    upcomingEvents,
    completedEvents,
    cancelledEvents,
    eventsNeedingVolunteers,
    totalEmployees,
    availableEmployees,
    assignedVolunteers: totalAssignments,
    volunteerHours: Math.round(totalVolunteerHours),
    attendanceRate: Math.round(attendanceRate * 10) / 10,
    recentActivity,
  };
}

export async function getMonthlyChartData() {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const date = subMonths(new Date(), i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);

    const [eventsCount, volunteersCount] = await Promise.all([
      prisma.event.count({
        where: { date: { gte: start, lte: end }, isCancelled: false },
      }),
      prisma.eventAssignment.count({
        where: { assignedAt: { gte: start, lte: end } },
      }),
    ]);

    months.push({
      month: date.toLocaleString("default", { month: "short" }),
      events: eventsCount,
      volunteers: volunteersCount,
    });
  }
  return months;
}

export async function getTopVolunteers(limit = 5) {
  return prisma.employee.findMany({
    where: { isActive: true },
    orderBy: { eventsAttended: "desc" },
    take: limit,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarColor: true,
      jobTitle: true,
      eventsAttended: true,
      volunteerHours: true,
      attendanceRate: true,
      department: { select: { name: true } },
    },
  });
}

export async function getEventsByCategory() {
  const categories = await prisma.eventCategory.findMany({
    include: {
      _count: { select: { events: true } },
    },
  });

  return categories
    .filter((c) => c._count.events > 0)
    .map((c) => ({
      name: c.name,
      value: c._count.events,
      color: c.color,
    }))
    .sort((a, b) => b.value - a.value);
}

export async function getUpcomingEvents(limit = 5) {
  const today = startOfDay(new Date());
  return prisma.event.findMany({
    where: {
      date: { gte: today },
      isCancelled: false,
    },
    include: {
      category: { select: { name: true, color: true } },
      organizer: { select: { firstName: true, lastName: true } },
      _count: { select: { assignments: true } },
    },
    orderBy: { date: "asc" },
    take: limit,
  });
}

export async function getTodayEvents() {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  return prisma.event.findMany({
    where: {
      date: { gte: todayStart, lte: todayEnd },
      isCancelled: false,
    },
    include: {
      category: { select: { name: true, color: true } },
      _count: { select: { assignments: true } },
    },
    orderBy: { startTime: "asc" },
  });
}

export async function getRecentNotifications(userId: string, limit = 5) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
