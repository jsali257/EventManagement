import {
  LayoutDashboard,
  CalendarDays,
  Users,
  ClipboardList,
  BarChart3,
  Settings,
  Bell,
  UserCheck,
  FileText,
  History,
  Shield,
} from "lucide-react";
import type { NavItem } from "@/types";

export const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview and statistics",
  },
  {
    title: "Events",
    href: "/events",
    icon: CalendarDays,
    description: "Manage outreach events",
  },
  {
    title: "Volunteer Board",
    href: "/volunteer-board",
    icon: UserCheck,
    description: "Assign volunteers to events",
  },
  {
    title: "Calendar",
    href: "/calendar",
    icon: CalendarDays,
    description: "Calendar view of events",
  },
  {
    title: "Employees",
    href: "/employees",
    icon: Users,
    description: "Manage department employees",
  },
  {
    title: "Attendance",
    href: "/attendance",
    icon: ClipboardList,
    description: "Track event attendance",
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
    description: "Generate and export reports",
    adminOnly: true,
  },
];

export const secondaryNavItems: NavItem[] = [
  {
    title: "Notifications",
    href: "/notifications",
    icon: Bell,
    description: "View all notifications",
  },
  {
    title: "Documents",
    href: "/documents",
    icon: FileText,
    description: "Event attachments and files",
  },
  {
    title: "Activity Log",
    href: "/activity-log",
    icon: History,
    description: "System activity history",
    adminOnly: true,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Application settings",
    adminOnly: true,
  },
];

export const adminNavItems: NavItem[] = [
  {
    title: "Admin",
    href: "/admin",
    icon: Shield,
    description: "Administration panel",
    adminOnly: true,
  },
];
