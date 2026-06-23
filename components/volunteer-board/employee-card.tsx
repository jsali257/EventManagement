"use client";

import { useId } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, getEmployeeStatusColor, cn } from "@/lib/utils";

interface EmployeeCardProps {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    jobTitle: string;
    avatarColor: string;
    profilePicture: string | null;
    status: string;
    department: { name: string; color: string };
  };
  isDraggable?: boolean;
  isOverlay?: boolean;
  onTap?: () => void;
  compact?: boolean;
  isInEvent?: boolean;
}

export function EmployeeCard({
  employee,
  isDraggable = false,
  isOverlay = false,
  onTap,
  compact = false,
  isInEvent = false,
}: EmployeeCardProps) {
  const instanceId = useId();
  // Non-draggable instances (in-event cards, overlay) get a unique ID so they
  // never conflict with the sidebar draggable that shares the same employee.id.
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: isDraggable ? employee.id : `view-${instanceId}`,
      disabled: !isDraggable,
    });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const isAvailable = employee.status === "AVAILABLE";

  const content = (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border bg-card p-2 transition-all select-none",
        isDraggable && isAvailable && "cursor-grab active:cursor-grabbing hover:border-primary/50 hover:shadow-sm",
        !isAvailable && "opacity-60",
        isDragging && "opacity-40",
        isOverlay && "shadow-lg ring-1 ring-primary/20 rotate-2 scale-105",
        compact && "p-1.5 gap-1.5",
        onTap && "cursor-pointer active:scale-95"
      )}
      onClick={onTap}
    >
      {isDraggable && (
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 cursor-grab" />
      )}

      <Avatar className={cn("shrink-0", compact ? "h-6 w-6" : "h-8 w-8")}>
        <AvatarImage
          src={employee.profilePicture ?? undefined}
          alt={`${employee.firstName} ${employee.lastName}`}
        />
        <AvatarFallback
          className={cn(
            "text-white font-semibold",
            compact ? "text-[10px]" : "text-xs"
          )}
          style={{ backgroundColor: employee.avatarColor }}
        >
          {getInitials(`${employee.firstName} ${employee.lastName}`)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "font-medium truncate leading-none",
            compact ? "text-xs" : "text-xs"
          )}
        >
          {employee.firstName} {employee.lastName}
        </p>
        {!compact && (
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
            {employee.department.name}
          </p>
        )}
      </div>

      {!compact && !isInEvent && (
        <div
          className={cn(
            "shrink-0 h-2 w-2 rounded-full",
            isAvailable ? "bg-green-500" : "bg-yellow-500"
          )}
          title={employee.status}
        />
      )}
    </div>
  );

  if (!isDraggable) return content;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} suppressHydrationWarning>
      {content}
    </div>
  );
}
