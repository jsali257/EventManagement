import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadToStorage } from "@/lib/storage";

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB for cover images
const ALLOWED_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp"]);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file.size > MAX_SIZE_BYTES) return NextResponse.json({ error: "File exceeds 10 MB limit" }, { status: 400 });

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXTS.has(ext)) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { viewUrl } = await uploadToStorage(buffer, file.name, file.type || "image/jpeg");

    return NextResponse.json({ url: viewUrl });
  } catch (error) {
    console.error("[upload-cover]", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
