/**
 * Converts a storage server URL to a proxied URL served by this Next.js app.
 * Safe to import in both client and server components.
 * Falls back to the original value for relative/local paths.
 */
export function proxyUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (!url.startsWith("http")) return url;
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}
