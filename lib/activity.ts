import { prisma } from "@/lib/prisma";
import type { ActivityAction } from "@/types";

interface LogActivityParams {
  action: ActivityAction;
  entityType: string;
  entityId: string;
  description: string;
  userId: string;
  eventId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export async function logActivity(params: LogActivityParams) {
  try {
    await prisma.activityLog.create({
      data: {
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        description: params.description,
        userId: params.userId,
        eventId: params.eventId,
        metadata: params.metadata as never,
        ipAddress: params.ipAddress,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
