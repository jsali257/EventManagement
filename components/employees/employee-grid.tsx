"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Phone,
  Mail,
  Calendar,
  Clock,
  MoreVertical,
  UserCog,
  Ban,
  UserCheck,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  getInitials,
  getEmployeeStatusColor,
  getEmployeeStatusLabel,
  cn,
} from "@/lib/utils";
import { deactivateEmployee, reactivateEmployee } from "@/actions/employees";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  email: string;
  phone: string | null;
  jobTitle: string;
  status: string;
  profilePicture: string | null;
  avatarColor: string;
  eventsAttended: number;
  volunteerHours: number;
  attendanceRate: number;
  department: { id: string; name: string; color: string };
  _count: { assignments: number };
}

interface EmployeeGridProps {
  employees: Employee[];
  total: number;
  page: number;
  pageSize: number;
  isAdmin?: boolean;
  showInactive?: boolean;
}

export function EmployeeGrid({
  employees,
  total,
  page,
  pageSize,
  isAdmin,
  showInactive,
}: EmployeeGridProps) {
  const router = useRouter();
  const totalPages = Math.ceil(total / pageSize);
  const isAvailable = (status: string) => status === "AVAILABLE";

  const [confirmEmployee, setConfirmEmployee] = useState<Employee | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const handleDeactivate = async () => {
    if (!confirmEmployee) return;
    setIsDeactivating(true);
    try {
      const result = await deactivateEmployee(confirmEmployee.id);
      if (result.success) {
        toast.success(`${confirmEmployee.firstName} ${confirmEmployee.lastName} deactivated`);
        setConfirmEmployee(null);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to deactivate employee");
      }
    } finally {
      setIsDeactivating(false);
    }
  };

  const [confirmReactivate, setConfirmReactivate] = useState<Employee | null>(null);
  const [isReactivating, setIsReactivating] = useState(false);

  const handleReactivate = async () => {
    if (!confirmReactivate) return;
    setIsReactivating(true);
    try {
      const result = await reactivateEmployee(confirmReactivate.id);
      if (result.success) {
        toast.success(`${confirmReactivate.firstName} ${confirmReactivate.lastName} reactivated`);
        setConfirmReactivate(null);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to reactivate employee");
      }
    } finally {
      setIsReactivating(false);
    }
  };

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Calendar className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold">No employees found</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your filters
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {employees.map((employee, index) => (
          <motion.div
            key={employee.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.03 }}
          >
            <Link href={`/employees/${employee.id}`}>
              <div
                className={cn(
                  "group relative flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
                  !isAvailable(employee.status) && "opacity-75"
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={employee.profilePicture ?? undefined}
                      alt={`${employee.firstName} ${employee.lastName}`}
                    />
                    <AvatarFallback
                      className="text-white font-semibold text-sm"
                      style={{ backgroundColor: employee.avatarColor }}
                    >
                      {getInitials(`${employee.firstName} ${employee.lastName}`)}
                    </AvatarFallback>
                  </Avatar>

                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/employees/${employee.id}/edit`}>
                            <UserCog className="mr-2 h-4 w-4" />
                            Edit Employee
                          </Link>
                        </DropdownMenuItem>
                        {showInactive ? (
                          <DropdownMenuItem
                            className="text-green-600"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setConfirmReactivate(employee);
                            }}
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            Reactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setConfirmEmployee(employee);
                            }}
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Deactivate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* Name & Title */}
                <div>
                  <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors">
                    {employee.firstName} {employee.lastName}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {employee.jobTitle}
                  </p>
                </div>

                {/* Department badge */}
                <Badge
                  variant="outline"
                  className="w-fit text-xs"
                  style={{
                    color: employee.department.color,
                    borderColor: `${employee.department.color}40`,
                  }}
                >
                  {employee.department.name}
                </Badge>

                {/* Status */}
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      getEmployeeStatusColor(employee.status as never)
                    )}
                  >
                    {getEmployeeStatusLabel(employee.status as never)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    #{employee.employeeId}
                  </span>
                </div>

                {/* Stats */}
                <div className="border-t pt-3 grid grid-cols-2 gap-2">
                  <div className="text-center">
                    <p className="text-sm font-semibold">{employee.eventsAttended}</p>
                    <p className="text-xs text-muted-foreground">Events</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold">
                      {Math.round(employee.attendanceRate)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Attendance</p>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={`?page=${page - 1}`}
                aria-disabled={page <= 1}
                className={page <= 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    href={`?page=${pageNum}`}
                    isActive={pageNum === page}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            <PaginationItem>
              <PaginationNext
                href={`?page=${page + 1}`}
                aria-disabled={page >= totalPages}
                className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      <AlertDialog open={!!confirmEmployee} onOpenChange={(open) => { if (!open) setConfirmEmployee(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate{" "}
              <strong>{confirmEmployee?.firstName} {confirmEmployee?.lastName}</strong>?
              They will no longer appear in the active employee list and will lose access to the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeactivating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              disabled={isDeactivating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeactivating ? "Deactivating..." : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmReactivate} onOpenChange={(open) => { if (!open) setConfirmReactivate(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reactivate Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Reactivate{" "}
              <strong>{confirmReactivate?.firstName} {confirmReactivate?.lastName}</strong>?
              They will be restored to active status and regain system access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReactivating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReactivate}
              disabled={isReactivating}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {isReactivating ? "Reactivating..." : "Reactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
