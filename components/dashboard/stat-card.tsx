"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  CalendarDays, Users, UserCheck, CheckCircle, AlertTriangle,
  Clock, Heart, Activity, BarChart3, TrendingUp, Star, Award,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  CalendarDays,
  Users,
  UserCheck,
  CheckCircle,
  AlertTriangle,
  Clock,
  Heart,
  Activity,
  BarChart3,
  TrendingUp,
  Star,
  Award,
};

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  className?: string;
  index?: number;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
  trend,
  className,
  index = 0,
}: StatCardProps) {
  const Icon = ICON_MAP[icon] ?? Activity;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground truncate">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {typeof value === "number" ? value.toLocaleString() : value}
            </span>
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <div
              className={cn(
                "mt-2 flex items-center gap-1 text-xs font-medium",
                trend.positive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}
            >
              <span>{trend.positive ? "↑" : "↓"}</span>
              <span>{trend.value}% {trend.label}</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110",
            iconBg
          )}
        >
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-primary/3 to-transparent" />
    </motion.div>
  );
}
