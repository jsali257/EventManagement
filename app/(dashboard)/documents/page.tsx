import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { FileText, Paperclip, ExternalLink, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Documents" };

async function DocumentsContent() {
  const session = await auth();
  if (!session?.user) return null;

  const [attachments, photos] = await Promise.all([
    prisma.attachment.findMany({
      include: {
        event: { select: { id: true, title: true } },
        uploadedBy: { select: { name: true } },
      },
      orderBy: { uploadedAt: "desc" },
      take: 100,
    }),
    prisma.eventPhoto.findMany({
      include: {
        event: { select: { id: true, title: true } },
        uploadedBy: { select: { name: true } },
      },
      orderBy: { uploadedAt: "desc" },
      take: 100,
    }),
  ]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Documents</h1>
        <p className="text-muted-foreground text-sm mt-1">
          All uploaded files and photos across events
        </p>
      </div>

      {/* Attachments */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            Attachments ({attachments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {attachments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No attachments uploaded yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {attachments.map((file) => (
                <div key={file.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.originalName}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      {file.event && (
                        <Link
                          href={`/events/${file.event.id}`}
                          className="text-xs text-primary hover:underline"
                        >
                          {file.event.title}
                        </Link>
                      )}
                      <span className="text-muted-foreground/40">·</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(file.uploadedAt), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant="outline" className="text-xs">
                      {file.fileType}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatSize(file.fileSize)}
                    </span>
                    <a
                      href={file.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Event Photos ({photos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ImageIcon className="h-10 w-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No photos uploaded yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {photos.map((photo) => (
                <Link key={photo.id} href={photo.event ? `/events/${photo.event.id}` : "#"}>
                  <div className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
                    <img
                      src={photo.filePath}
                      alt={photo.caption ?? photo.originalName}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    {photo.event && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end">
                        <div className="w-full p-2 translate-y-full group-hover:translate-y-0 transition-transform">
                          <p className="text-white text-xs truncate">
                            {photo.event.title}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      }
    >
      <DocumentsContent />
    </Suspense>
  );
}
