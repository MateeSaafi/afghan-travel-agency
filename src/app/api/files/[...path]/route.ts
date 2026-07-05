import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { contentTypeFor, resolveUploadPath } from "@/lib/uploads";

// Serves publicly-viewable uploads (package images, appointment documents).
// Deliverables are deliberately NOT served here — they go through the
// auth-gated, payment-checked /api/deliverables route.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const relativePath = segments.join("/");

  if (!/^(images|documents)\//.test(relativePath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const absolutePath = resolveUploadPath(relativePath);
  if (!absolutePath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const data = await readFile(absolutePath);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": contentTypeFor(absolutePath),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
