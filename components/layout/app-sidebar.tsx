"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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
  ChevronRight,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getInitials } from "@/lib/utils";

interface AppSidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
  notificationCount?: number;
}

const mainNav = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Events", href: "/events", icon: CalendarDays },
  { title: "Volunteer Board", href: "/volunteer-board", icon: UserCheck },
  { title: "Calendar", href: "/calendar", icon: CalendarDays },
  { title: "Employees", href: "/employees", icon: Users },
  { title: "Attendance", href: "/attendance", icon: ClipboardList },
];

const managementNav = [
  { title: "Reports", href: "/reports", icon: BarChart3, adminOnly: true },
  { title: "Documents", href: "/documents", icon: FileText },
  { title: "Activity Log", href: "/activity-log", icon: History, adminOnly: true },
];

const systemNav = [
  { title: "Notifications", href: "/notifications", icon: Bell },
  { title: "Settings", href: "/settings", icon: Settings, adminOnly: true },
];

export function AppSidebar({ user, notificationCount = 0 }: AppSidebarProps) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isAdmin = user?.role === "ADMIN";
  const isCollapsed = state === "collapsed";

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Building2 className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-sidebar-foreground leading-none">
                Volunteer MS
              </p>
              <p className="truncate text-xs text-sidebar-foreground/60 mt-0.5">
                Public Education Dept.
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-2">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider px-3 py-1.5">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                    className={cn(
                      "group relative h-9 transition-all",
                      isActive(item.href) &&
                        "bg-sidebar-primary/10 text-sidebar-primary font-medium"
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          isActive(item.href)
                            ? "text-sidebar-primary"
                            : "text-sidebar-foreground/70"
                        )}
                      />
                      <span>{item.title}</span>
                      {isActive(item.href) && (
                        <ChevronRight className="ml-auto h-3.5 w-3.5 text-sidebar-primary/70" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="mx-3 my-1 bg-sidebar-border" />

        {/* Management */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider px-3 py-1.5">
            Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementNav
                .filter((item) => !item.adminOnly || isAdmin)
                .map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.href)}
                      tooltip={item.title}
                      className={cn(
                        "group relative h-9 transition-all",
                        isActive(item.href) &&
                          "bg-sidebar-primary/10 text-sidebar-primary font-medium"
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-colors",
                            isActive(item.href)
                              ? "text-sidebar-primary"
                              : "text-sidebar-foreground/70"
                          )}
                        />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="mx-3 my-1 bg-sidebar-border" />

        {/* System */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider px-3 py-1.5">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemNav
                .filter((item) => !("adminOnly" in item) || !item.adminOnly || isAdmin)
                .map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.href)}
                      tooltip={item.title}
                      className={cn(
                        "group relative h-9 transition-all",
                        isActive(item.href) &&
                          "bg-sidebar-primary/10 text-sidebar-primary font-medium"
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-colors",
                            isActive(item.href)
                              ? "text-sidebar-primary"
                              : "text-sidebar-foreground/70"
                          )}
                        />
                        <span>{item.title}</span>
                        {item.href === "/notifications" && notificationCount > 0 && (
                          <SidebarMenuBadge className="bg-destructive text-destructive-foreground">
                            {notificationCount > 99 ? "99+" : notificationCount}
                          </SidebarMenuBadge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip={user?.name ?? "Profile"}
              className="h-10 w-full"
            >
              <Link href="/profile">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? ""} />
                  <AvatarFallback className="text-xs bg-primary/20 text-primary">
                    {getInitials(user?.name ?? user?.email ?? "U")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-sidebar-foreground leading-none">
                    {user?.name ?? "User"}
                  </p>
                  <p className="truncate text-xs text-sidebar-foreground/50 mt-0.5">
                    {user?.role === "ADMIN" ? "Administrator" : "Employee"}
                  </p>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
