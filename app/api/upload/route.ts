import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { uploadToStorage } from "@/lib/storage";
import type { FileType } from "@prisma/client";

const MAX_SIZE_BYTES = 25 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([
  "pdf", "doc", "docx", "xls", "xlsx",
  "jpg", "jpeg", "png", "gif", "webp",
]);
const PHOTO_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp"]);

function mimeToFileType(mimeType: string, ext: string): FileType {
  if (ext === "pdf") return "PDF";
  if (["doc", "docx"].includes(ext)) return "WORD";
  if (["xls", "xlsx"].includes(ext)) return "EXCEL";
  if (PHOTO_EXTENSIONS.has(ext)) return "IMAGE";
  return "OTHER";
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const eventId = formData.get("eventId") as string | null;
    const type = formData.get("type") as "attachment" | "photo" | null;
    const caption = formData.get("caption") as string | null;

    if (!file || !eventId || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "File exceeds 25 MB limit" }, { status: 400 });
    }

    const originalName = file.name;
    const ext = originalName.split(".").pop()?.toLowerCase() ?? "";

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const mimeType = file.type || "application/octet-stream";
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to storage server and get a public view URL
    const { viewUrl, fileId: storageFileId } = await uploadToStorage(buffer, originalName, mimeType);

    if (type === "photo" && PHOTO_EXTENSIONS.has(ext)) {
      const photo = await prisma.eventPhoto.create({
        data: {
          eventId,
          fileName: storageFileId,
          originalName,
          fileSize: file.size,
          filePath: viewUrl,
          caption: caption || null,
          uploadedById: session.user.id,
        },
      });

      await logActivity({
        userId: session.user.id,
        action: "EVENT_UPDATED",
        entityType: "EventPhoto",
        entityId: photo.id,
        description: `Uploaded photo "${originalName}" to event "${event.title}"`,
      });

      return NextResponse.json({ success: true, id: photo.id, path: viewUrl });
    } else {
      const fileType = mimeToFileType(mimeType, ext);
      const attachment = await prisma.attachment.create({
        data: {
          eventId,
          fileName: storageFileId,
          originalName,
          fileSize: file.size,
          fileType,
          mimeType,
          filePath: viewUrl,
          uploadedById: session.user.id,
        },
      });

      await logActivity({
        userId: session.user.id,
        action: "EVENT_UPDATED",
        entityType: "Attachment",
        entityId: attachment.id,
        description: `Uploaded file "${originalName}" to event "${event.title}"`,
      });

      return NextResponse.json({ success: true, id: attachment.id, path: viewUrl });
    }
  } catch (error) {
    console.error("[upload]", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
