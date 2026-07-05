import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { adminDb } from "@/lib/firebase-admin";
import { verifyBearerToken } from "@/lib/api-auth";
import {
  UPLOAD_KINDS,
  UploadKind,
  ensureUploadDir,
  safeExtension,
} from "@/lib/uploads";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

async function getUserRole(email: string | undefined): Promise<string> {
  if (!email) return "user";
  const snapshot = await adminDb
    .collection("users")
    .where("email", "==", email)
    .limit(1)
    .get();
  if (snapshot.empty) return "user";
  return snapshot.docs[0].data().role || "user";
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verify Firebase ID token
    const auth = await verifyBearerToken(request);
    if (!auth.ok) return auth.response;

    // 2. Validate kind + role
    const kind = request.nextUrl.searchParams.get("kind") as UploadKind | null;
    if (!kind || !(kind in UPLOAD_KINDS)) {
      return NextResponse.json({ error: "Invalid upload kind" }, { status: 400 });
    }
    if (UPLOAD_KINDS[kind].adminOnly) {
      const role = await getUserRole(auth.email);
      if (role !== "admin" && role !== "superadmin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // 3. Read and validate the file
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File must be between 1 byte and 10MB" },
        { status: 400 }
      );
    }
    if (kind === "image" && !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    // 4. Save to disk with a random name (original name is kept in Firestore)
    const dir = await ensureUploadDir(kind);
    const fileName = `${crypto.randomUUID()}${safeExtension(file.name)}`;
    await writeFile(
      path.join(dir, fileName),
      Buffer.from(await file.arrayBuffer())
    );

    const relativePath = `${UPLOAD_KINDS[kind].dir}/${fileName}`;
    return NextResponse.json({
      name: file.name,
      path: relativePath,
      // Public kinds are reachable through the file-serving route; deliverables
      // are only reachable through the auth-gated /api/deliverables route.
      url: UPLOAD_KINDS[kind].public ? `/api/files/${relativePath}` : null,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
