const BASE_URL = process.env.STORAGE_API_URL!;
const API_KEY = process.env.STORAGE_API_KEY!;

function storageHeaders(extra: Record<string, string> = {}) {
  return { "X-API-Key": API_KEY, ...extra };
}

export interface UploadResult {
  fileId: string;
  viewUrl: string;
  originalName: string;
}

/**
 * Upload a file buffer to the storage server, create a public share, and
 * return the view URL that can be stored in the DB and used directly in
 * <img src="...">, <a href="...">, etc.
 */
export async function uploadToStorage(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<UploadResult> {
  // 1. Upload the file
  const form = new FormData();
  const blob = new Blob([buffer as unknown as ArrayBuffer], { type: mimeType });
  form.append("file", blob, originalName);

  const uploadRes = await fetch(`${BASE_URL}/files/upload`, {
    method: "POST",
    headers: storageHeaders(),
    body: form,
  });

  if (!uploadRes.ok) {
    const text = await uploadRes.text().catch(() => uploadRes.statusText);
    throw new Error(`Storage upload failed (${uploadRes.status}): ${text}`);
  }

  const { id: fileId, originalName: storedName } = await uploadRes.json() as {
    id: string;
    originalName: string;
  };

  // 2. Create a public share link
  const shareRes = await fetch(`${BASE_URL}/shares`, {
    method: "POST",
    headers: storageHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ fileId }),
  });

  if (!shareRes.ok) {
    const text = await shareRes.text().catch(() => shareRes.statusText);
    throw new Error(`Share creation failed (${shareRes.status}): ${text}`);
  }

  const { token } = await shareRes.json() as { token: string };

  const name = storedName ?? originalName;
  const viewUrl = `${BASE_URL}/shares/${token}/view/${encodeURIComponent(name)}`;

  return { fileId, viewUrl, originalName: name };
}

export { proxyUrl } from "./proxy-url";

/** Delete a file by its storage file ID (moves to trash). */
export async function deleteFromStorage(fileId: string): Promise<void> {
  await fetch(`${BASE_URL}/files/${fileId}`, {
    method: "DELETE",
    headers: storageHeaders(),
  });
}
