import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@/types";

interface CreateNotificationParams {
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    return await prisma.notification.create({
      data: {
        type: params.type,
        title: params.title,
        message: params.message,
        userId: params.userId,
        entityType: params.entityType,
        entityId: params.entityId,
        actionUrl: params.actionUrl,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}

export async function createNotifications(
  params: CreateNotificationParams[]
) {
  try {
    return await prisma.notification.createMany({
      data: params.map((p) => ({
        type: p.type,
        title: p.title,
        message: p.message,
        userId: p.userId,
        entityType: p.entityType,
        entityId: p.entityId,
        actionUrl: p.actionUrl,
      })),
    });
  } catch (error) {
    console.error("Failed to create notifications:", error);
    return null;
  }
}

export async function notifyVolunteerAssigned(
  userId: string,
  eventTitle: string,
  eventId: string
) {
  return createNotification({
    type: "ASSIGNED",
    title: "You've been assigned to an event",
    message: `You've been assigned as a volunteer for "${eventTitle}"`,
    userId,
    entityType: "Event",
    entityId: eventId,
    actionUrl: `/events/${eventId}`,
  });
}

export async function notifyVolunteerRemoved(
  userId: string,
  eventTitle: string,
  eventId: string
) {
  return createNotification({
    type: "REMOVED",
    title: "Removed from event",
    message: `You've been removed from "${eventTitle}"`,
    userId,
    entityType: "Event",
    entityId: eventId,
    actionUrl: `/events/${eventId}`,
  });
}

export async function notifyEventUpdated(
  userIds: string[],
  eventTitle: string,
  eventId: string
) {
  return createNotifications(
    userIds.map((userId) => ({
      type: "EVENT_UPDATED" as NotificationType,
      title: "Event updated",
      message: `"${eventTitle}" has been updated. Please review the changes.`,
      userId,
      entityType: "Event",
      entityId: eventId,
      actionUrl: `/events/${eventId}`,
    }))
  );
}

export async function notifyEventCancelled(
  userIds: string[],
  eventTitle: string,
  eventId: string
) {
  return createNotifications(
    userIds.map((userId) => ({
      type: "EVENT_CANCELLED" as NotificationType,
      title: "Event cancelled",
      message: `"${eventTitle}" has been cancelled.`,
      userId,
      entityType: "Event",
      entityId: eventId,
      actionUrl: `/events/${eventId}`,
    }))
  );
}
