import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsDashboard } from "@/components/settings/settings-dashboard";

export const metadata: Metadata = { title: "Settings" };

async function SettingsContent() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const [settings, departments, categories] = await Promise.all([
    prisma.appSetting.findMany({ orderBy: { key: "asc" } }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.eventCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <SettingsDashboard
      settings={settings}
      departments={departments}
      categories={categories}
    />
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-32" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
