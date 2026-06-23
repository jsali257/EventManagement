"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { Printer, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { getInitials } from "@/lib/utils";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  avatarColor: string;
  jobTitle: string;
  eventsAttended: number;
  volunteerHours: number;
  attendanceRate: number;
  volunteerScore: number;
  department: { name: string };
  _count: { assignments: number; attendance: number };
}

interface Event {
  id: string;
  title: string;
  date: Date;
  location: string;
  minVolunteers: number;
  isCancelled: boolean;
  category: { name: string; color: string };
  _count: { assignments: number; attendance: number };
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Department {
  id: string;
  name: string;
}

interface ReportsDashboardProps {
  employees: Employee[];
  events: Event[];
  categories: Category[];
  departments: Department[];
}

export function ReportsDashboard({
  employees,
  events,
  categories,
  departments,
}: ReportsDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Volunteer participation data
  const topVolunteers = [...employees]
    .sort((a, b) => b.eventsAttended - a.eventsAttended)
    .slice(0, 10);

  const leastVolunteers = [...employees]
    .filter((e) => e.eventsAttended === 0 || e._count.assignments < 3)
    .slice(0, 10);

  // Events by category
  const categoryData = categories.map((cat) => ({
    name: cat.name,
    count: events.filter((e) => e.category.name === cat.name && !e.isCancelled).length,
    color: cat.color,
  })).filter((c) => c.count > 0).sort((a, b) => b.count - a.count);

  // Monthly events over last 12 months
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), 11 - i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const monthEvents = events.filter((e) => {
      const d = new Date(e.date);
      return d >= start && d <= end && !e.isCancelled;
    });
    return {
      month: format(date, "MMM"),
      events: monthEvents.length,
      volunteers: monthEvents.reduce((sum, e) => sum + e._count.assignments, 0),
    };
  });

  // Attendance summary
  const totalAssignments = events.reduce((s, e) => s + e._count.assignments, 0);
  const totalAttended = employees.reduce((s, e) => s + e.eventsAttended, 0);
  const overallAttendance = totalAssignments > 0
    ? (totalAttended / totalAssignments) * 100
    : 0;

  const handleExportExcel = async () => {
    try {
      const { utils, writeFile } = await import("xlsx");
      const wb = utils.book_new();

      // Volunteer participation sheet
      const volunteerData = employees.map((e) => ({
        "Employee ID": e.id,
        "First Name": e.firstName,
        "Last Name": e.lastName,
        "Department": e.department.name,
        "Job Title": e.jobTitle,
        "Events Attended": e.eventsAttended,
        "Volunteer Hours": e.volunteerHours,
        "Attendance Rate %": Math.round(e.attendanceRate),
        "Volunteer Score": e.volunteerScore,
      }));
      utils.book_append_sheet(wb, utils.json_to_sheet(volunteerData), "Volunteer Participation");

      // Events sheet
      const eventData = events.map((e) => ({
        "Event Title": e.title,
        "Date": format(new Date(e.date), "MM/dd/yyyy"),
        "Category": e.category.name,
        "Location": e.location,
        "Max Volunteers": e.minVolunteers,
        "Assigned": e._count.assignments,
        "Fill Rate %": e.minVolunteers > 0
          ? Math.round((e._count.assignments / e.minVolunteers) * 100)
          : 0,
        "Status": e.isCancelled ? "Cancelled" : "Active",
      }));
      utils.book_append_sheet(wb, utils.json_to_sheet(eventData), "Events");

      writeFile(wb, `VMS-Report-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
      toast.success("Report exported to Excel");
    } catch {
      toast.error("Failed to export report");
    }
  };

  const handlePrint = () => window.print();

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Volunteer participation, attendance, and event analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Total Events", value: events.filter((e) => !e.isCancelled).length },
          { label: "Total Volunteers", value: employees.length },
          { label: "Total Assignments", value: totalAssignments },
          { label: "Attendance Rate", value: `${Math.round(overallAttendance)}%` },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="volunteers">Volunteers</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Monthly Activity */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Monthly Activity (Last 12 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Bar dataKey="events" name="Events" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} maxBarSize={30} />
                    <Bar dataKey="volunteers" name="Assignments" fill="hsl(var(--primary)/0.4)" radius={[3, 3, 0, 0]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Events by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Events by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="count">
                      {categoryData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px" }} iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Volunteer Hours Bar */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Volunteer Hours — Top 8</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={topVolunteers.slice(0, 8).map((e) => ({
                      name: `${e.firstName[0]}. ${e.lastName}`,
                      hours: Math.round(e.volunteerHours),
                    }))}
                    layout="vertical"
                    margin={{ top: 0, right: 10, left: 60, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} width={55} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="hours" name="Hours" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Volunteers Tab */}
        <TabsContent value="volunteers" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Volunteer Participation</CardTitle>
              <CardDescription>Sorted by most active volunteers</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">Events</TableHead>
                      <TableHead className="text-right">Hours</TableHead>
                      <TableHead className="text-right">Attendance</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback
                                className="text-white text-xs"
                                style={{ backgroundColor: employee.avatarColor }}
                              >
                                {getInitials(`${employee.firstName} ${employee.lastName}`)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">
                                {employee.firstName} {employee.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {employee.jobTitle}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{employee.department.name}</TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          {employee.eventsAttended}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {Math.round(employee.volunteerHours)}h
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant="outline"
                            className={
                              employee.attendanceRate >= 90
                                ? "text-green-600 border-green-300"
                                : employee.attendanceRate >= 70
                                ? "text-yellow-600 border-yellow-300"
                                : "text-red-600 border-red-300"
                            }
                          >
                            {Math.round(employee.attendanceRate)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {employee.volunteerScore}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Event Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Slots</TableHead>
                      <TableHead className="text-right">Filled</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event) => {
                      const fillPct = event.minVolunteers > 0
                        ? Math.round((event._count.assignments / event.minVolunteers) * 100)
                        : 0;
                      return (
                        <TableRow key={event.id}>
                          <TableCell className="font-medium text-sm max-w-[200px]">
                            <span className="truncate block">{event.title}</span>
                          </TableCell>
                          <TableCell className="text-sm whitespace-nowrap">
                            {format(new Date(event.date), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <span
                              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                              style={{
                                backgroundColor: `${event.category.color}20`,
                                color: event.category.color,
                              }}
                            >
                              {event.category.name}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {event.minVolunteers}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {event._count.assignments} ({fillPct}%)
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                event.isCancelled
                                  ? "text-gray-500"
                                  : fillPct >= 100
                                  ? "text-green-600 border-green-300"
                                  : "text-yellow-600 border-yellow-300"
                              }
                            >
                              {event.isCancelled ? "Cancelled" : fillPct >= 100 ? "Full" : "Partial"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
