import path from "path";
import { mkdir } from "fs/promises";

// All uploaded files live under <project root>/uploads (outside public/ so
// they work the same in dev and production, and deliverables stay private).
export const UPLOADS_ROOT = path.join(process.cwd(), "uploads");

export const UPLOAD_KINDS = {
  image: { dir: "images", public: true, adminOnly: true },
  document: { dir: "documents", public: true, adminOnly: false },
  deliverable: { dir: "deliverables", public: false, adminOnly: true },
} as const;

export type UploadKind = keyof typeof UPLOAD_KINDS;

export async function ensureUploadDir(kind: UploadKind): Promise<string> {
  const dir = path.join(UPLOADS_ROOT, UPLOAD_KINDS[kind].dir);
  await mkdir(dir, { recursive: true });
  return dir;
}

// Resolve a stored relative path (e.g. "deliverables/abc.pdf") to an absolute
// path, refusing anything that escapes the uploads root.
export function resolveUploadPath(relativePath: string): string | null {
  const resolved = path.resolve(UPLOADS_ROOT, relativePath);
  if (!resolved.startsWith(UPLOADS_ROOT + path.sep)) {
    return null;
  }
  return resolved;
}

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".txt": "text/plain",
};

export function contentTypeFor(filePath: string): string {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

export function safeExtension(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  // Whitelist of extensions we accept; anything else becomes .bin
  return /^\.(jpg|jpeg|png|webp|gif|svg|pdf|doc|docx|txt)$/.test(ext) ? ext : ".bin";
}
