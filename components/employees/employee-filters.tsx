"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

interface Department {
  id: string;
  name: string;
}

interface EmployeeFiltersProps {
  departments: Department[];
  showInactive?: boolean;
}

const statusOptions = [
  { value: "AVAILABLE", label: "Available" },
  { value: "BUSY", label: "Busy" },
  { value: "VACATION", label: "Vacation" },
  { value: "SICK", label: "Sick" },
  { value: "TRAINING", label: "Training" },
  { value: "INACTIVE", label: "Inactive" },
];

const sortOptions = [
  { value: "name", label: "Name (A-Z)" },
  { value: "events-desc", label: "Most Events" },
  { value: "events-asc", label: "Least Events" },
  { value: "hours-desc", label: "Most Hours" },
  { value: "attendance", label: "Best Attendance" },
  { value: "score", label: "Volunteer Score" },
];

export function EmployeeFilters({ departments, showInactive }: EmployeeFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
        params.delete("page"); // Reset page on filter change
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleSearch = useDebouncedCallback((value: string) => {
    router.push(
      `${pathname}?${createQueryString({ search: value || null })}`
    );
  }, 300);

  const handleFilter = (key: string, value: string | null) => {
    router.push(`${pathname}?${createQueryString({ [key]: value })}`);
  };

  const hasActiveFilters =
    searchParams.has("department") ||
    searchParams.has("status") ||
    searchParams.has("search") ||
    searchParams.has("sort");

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search employees..."
          defaultValue={searchParams.get("search") ?? ""}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* Department filter */}
      <Select
        value={searchParams.get("department") ?? "all"}
        onValueChange={(v) =>
          handleFilter("department", v === "all" ? null : v)
        }
      >
        <SelectTrigger className="h-9 w-[160px]">
          <SelectValue placeholder="Department" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Departments</SelectItem>
          {departments.map((dept) => (
            <SelectItem key={dept.id} value={dept.id}>
              {dept.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status filter — hidden when viewing inactive employees */}
      {!showInactive && (
        <Select
          value={searchParams.get("status") ?? "all"}
          onValueChange={(v) => handleFilter("status", v === "all" ? null : v)}
        >
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statusOptions.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Sort */}
      <Select
        value={searchParams.get("sort") ?? "name"}
        onValueChange={(v) => handleFilter("sort", v === "name" ? null : v)}
      >
        <SelectTrigger className="h-9 w-[160px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 text-muted-foreground"
          onClick={() => router.push(pathname)}
        >
          <X className="mr-1 h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}
