"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, Loader2, X, Image, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FileUploadPanelProps {
  eventId: string;
  type: "attachment" | "photo";
}

export function FileUploadPanel({ eventId, type }: FileUploadPanelProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const accept = type === "photo"
    ? "image/jpeg,image/png,image/gif,image/webp"
    : ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp";

  // Generate / revoke object URL for image preview
  useEffect(() => {
    if (!selectedFile || type !== "photo") {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile, type]);

  const handleFile = (file: File) => {
    if (file.size > 25 * 1024 * 1024) {
      toast.error("File exceeds 25 MB limit");
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);

    try {
      const form = new FormData();
      form.append("file", selectedFile);
      form.append("eventId", eventId);
      form.append("type", type);
      if (caption) form.append("caption", caption);

      const res = await fetch("/api/upload", { method: "POST", body: form });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error ?? "Upload failed");

      toast.success(`${type === "photo" ? "Photo" : "File"} uploaded successfully`);
      setSelectedFile(null);
      setCaption("");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
  };

  return (
    <div className="space-y-3">
      {/* Drop zone — shows image preview for photos, filename for files */}
      <div
        className={cn(
          "relative rounded-xl border-2 border-dashed transition-colors cursor-pointer overflow-hidden",
          isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30",
          previewUrl ? "border-primary/40" : ""
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {previewUrl ? (
          /* Image preview */
          <div className="relative aspect-video w-full">
            <img
              src={previewUrl}
              alt="Preview"
              className="h-full w-full object-contain bg-black/5"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <p className="text-xs text-white truncate">{selectedFile?.name}</p>
              <p className="text-xs text-white/70">
                {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB` : ""}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7 bg-black/40 hover:bg-black/60 text-white"
              onClick={clearFile}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          /* Default drop zone */
          <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
            {type === "photo" ? (
              <Image className="h-8 w-8 text-muted-foreground" />
            ) : (
              <FileText className="h-8 w-8 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">
                {selectedFile ? selectedFile.name : "Click or drag to upload"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {type === "photo" ? "JPG, PNG, GIF, WEBP" : "PDF, DOC, XLS, images"} · Max 25 MB
              </p>
            </div>
            {selectedFile && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7"
                onClick={clearFile}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Caption (photos only) */}
      {type === "photo" && selectedFile && (
        <div>
          <Label htmlFor="caption" className="text-xs">Caption (optional)</Label>
          <Input
            id="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Describe the photo..."
            className="mt-1"
          />
        </div>
      )}

      {selectedFile && (
        <Button onClick={handleUpload} disabled={uploading} size="sm" className="w-full">
          {uploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          Upload {type === "photo" ? "Photo" : "File"}
        </Button>
      )}
    </div>
  );
}
