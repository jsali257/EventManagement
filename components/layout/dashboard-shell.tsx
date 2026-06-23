"use client";

import { useState } from "react";
import { TopNav } from "./top-nav";
import { GlobalSearch } from "./global-search";

interface DashboardShellProps {
  children: React.ReactNode;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
  notificationCount?: number;
}

export function DashboardShell({
  children,
  user,
  notificationCount,
}: DashboardShellProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav
        user={user}
        notificationCount={notificationCount}
        onSearchOpen={() => setSearchOpen(true)}
      />
      <main className="flex-1 overflow-auto">
        <div className="page-enter">{children}</div>
      </main>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
