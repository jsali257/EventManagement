import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.trim().length < 2) {
    return NextResponse.json([]);
  }

  const query = q.trim();

  const [employees, events] = await Promise.all([
    prisma.employee.findMany({
      where: {
        isActive: true,
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { employeeId: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { jobTitle: { contains: query, mode: "insensitive" } },
        ],
      },
      include: { department: true },
      take: 5,
    }),
    prisma.event.findMany({
      where: {
        isCancelled: false,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { location: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      include: { category: true },
      take: 5,
      orderBy: { date: "asc" },
    }),
  ]);

  const results = [
    ...employees.map((e) => ({
      type: "employee" as const,
      id: e.id,
      title: `${e.firstName} ${e.lastName}`,
      subtitle: `${e.jobTitle} · ${e.department.name}`,
      href: `/employees/${e.id}`,
    })),
    ...events.map((e) => ({
      type: "event" as const,
      id: e.id,
      title: e.title,
      subtitle: `${e.category.name} · ${new Date(e.date).toLocaleDateString()}`,
      href: `/events/${e.id}`,
    })),
  ];

  return NextResponse.json(results);
}
