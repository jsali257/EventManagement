import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const unreadCount = await prisma.notification
    .count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    })
    .catch(() => 0);

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          role: session.user.role,
        }}
        notificationCount={unreadCount}
      />
      <SidebarInset>
        <DashboardShell
          user={{
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
            role: session.user.role,
          }}
          notificationCount={unreadCount}
        >
          {children}
        </DashboardShell>
      </SidebarInset>
    </SidebarProvider>
  );
}
