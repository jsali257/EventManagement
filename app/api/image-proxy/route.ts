import { NextRequest, NextResponse } from "next/server";

const STORAGE_BASE = process.env.STORAGE_API_URL!;
const API_KEY = process.env.STORAGE_API_KEY!;

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return new NextResponse("Missing url param", { status: 400 });
  }

  // Only proxy URLs from our own storage server
  if (!url.startsWith(STORAGE_BASE)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const upstream = await fetch(url, {
      headers: { "X-API-Key": API_KEY },
    });

    if (!upstream.ok) {
      return new NextResponse("Failed to fetch image", { status: upstream.status });
    }

    const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
    const body = await upstream.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Proxy error", { status: 502 });
  }
}
