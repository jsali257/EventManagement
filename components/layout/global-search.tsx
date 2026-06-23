"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Users,
  Search,
  ArrowRight,
  Loader2,
  LayoutDashboard,
  UserCheck,
  ClipboardList,
  BarChart3,
  Plus,
  FileText,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

interface SearchResult {
  type: "employee" | "event";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const quickLinks = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, shortcut: "G D" },
  { label: "Events", href: "/events", icon: CalendarDays, shortcut: "G E" },
  { label: "Create New Event", href: "/events/new", icon: Plus, shortcut: "C E" },
  { label: "Volunteer Board", href: "/volunteer-board", icon: UserCheck, shortcut: "G V" },
  { label: "Employees", href: "/employees", icon: Users, shortcut: "G P" },
  { label: "Attendance", href: "/attendance", icon: ClipboardList, shortcut: "G A" },
  { label: "Reports", href: "/reports", icon: BarChart3, shortcut: "G R" },
  { label: "Documents", href: "/documents", icon: FileText, shortcut: "G F" },
];

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch {
      // silently handle
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  // Reset query when closed
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const handleSelect = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const employees = results.filter((r) => r.type === "employee");
  const events = results.filter((r) => r.type === "event");

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search employees, events, locations..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
          </div>
        )}

        {!isLoading && query && results.length === 0 && (
          <CommandEmpty>
            <div className="flex flex-col items-center gap-1 py-6">
              <Search className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No results for &quot;{query}&quot;</p>
              <p className="text-xs text-muted-foreground/60">Try searching by name, location, or category</p>
            </div>
          </CommandEmpty>
        )}

        {!isLoading && !query && (
          <CommandGroup heading="Quick Navigation">
            {quickLinks.map((link) => (
              <CommandItem
                key={link.href}
                onSelect={() => handleSelect(link.href)}
                className="flex items-center gap-3 px-3 py-2.5"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-muted/50">
                  <link.icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <span className="flex-1 text-sm">{link.label}</span>
                <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-60">
                  {link.shortcut}
                </kbd>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {employees.length > 0 && (
          <CommandGroup heading="Employees">
            {employees.map((result) => (
              <CommandItem
                key={result.id}
                onSelect={() => handleSelect(result.href)}
                className="flex items-center gap-3 px-3 py-2.5"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-muted/50">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm truncate">{result.title}</span>
                  <span className="text-xs text-muted-foreground truncate">{result.subtitle}</span>
                </div>
                <ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {employees.length > 0 && events.length > 0 && <CommandSeparator />}

        {events.length > 0 && (
          <CommandGroup heading="Events">
            {events.map((result) => (
              <CommandItem
                key={result.id}
                onSelect={() => handleSelect(result.href)}
                className="flex items-center gap-3 px-3 py-2.5"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-muted/50">
                  <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm truncate">{result.title}</span>
                  <span className="text-xs text-muted-foreground truncate">{result.subtitle}</span>
                </div>
                <ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>

      {/* Footer */}
      <div className="flex items-center gap-4 border-t px-4 py-2.5 text-[11px] text-muted-foreground/60">
        <span className="flex items-center gap-1.5">
          <kbd className="inline-flex h-4 items-center rounded border bg-muted px-1 font-mono text-[10px]">↑↓</kbd>
          Navigate
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="inline-flex h-4 items-center rounded border bg-muted px-1 font-mono text-[10px]">↵</kbd>
          Open
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="inline-flex h-4 items-center rounded border bg-muted px-1 font-mono text-[10px]">Esc</kbd>
          Close
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <kbd className="inline-flex h-4 items-center rounded border bg-muted px-1 font-mono text-[10px]">⌘K</kbd>
          Toggle
        </span>
      </div>
    </CommandDialog>
  );
}
