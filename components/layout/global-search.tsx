"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Users,
  Search,
  ArrowRight,
  Loader2,
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
import { Badge } from "@/components/ui/badge";

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
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {!isLoading && query && results.length === 0 && (
          <CommandEmpty>No results found for &quot;{query}&quot;</CommandEmpty>
        )}
        {!isLoading && !query && (
          <CommandGroup heading="Quick Links">
            <CommandItem onSelect={() => handleSelect("/dashboard")}>
              <Search className="mr-2 h-4 w-4" />
              Dashboard
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/events/new")}>
              <CalendarDays className="mr-2 h-4 w-4" />
              Create New Event
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/volunteer-board")}>
              <Users className="mr-2 h-4 w-4" />
              Volunteer Board
            </CommandItem>
          </CommandGroup>
        )}
        {employees.length > 0 && (
          <CommandGroup heading="Employees">
            {employees.map((result) => (
              <CommandItem
                key={result.id}
                onSelect={() => handleSelect(result.href)}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm">{result.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {result.subtitle}
                  </span>
                </div>
                <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
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
                className="flex items-center gap-2"
              >
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm">{result.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {result.subtitle}
                  </span>
                </div>
                <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
