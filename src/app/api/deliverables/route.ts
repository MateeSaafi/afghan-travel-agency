import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { adminDb } from "@/lib/firebase-admin";
import { verifyBearerToken } from "@/lib/api-auth";
import { contentTypeFor, resolveUploadPath } from "@/lib/uploads";

export async function GET(request: NextRequest) {
  try {
    // 1. Verify user authentication
    const auth = await verifyBearerToken(request);
    if (!auth.ok) return auth.response;
    const userId = auth.uid;

    // 2. Get appointmentId and fileIndex from query params
    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get("appointmentId");
    const fileIndex = searchParams.get("fileIndex");

    if (!appointmentId || fileIndex === null) {
      return NextResponse.json(
        { error: "Missing appointmentId or fileIndex" },
        { status: 400 }
      );
    }

    // 3. Fetch appointment
    const appointmentDoc = await adminDb
      .collection("appointments")
      .doc(appointmentId)
      .get();

    if (!appointmentDoc.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const appointment = appointmentDoc.data()!;

    // 4. Verify ownership
    if (appointment.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 5. PAYWALL CHECK — deliverables unlock only after successful payment
    const isPaid =
      appointment.payment?.status === "succeeded" ||
      appointment.status === "paid" ||
      appointment.status === "completed";
    if (!isPaid) {
      return NextResponse.json(
        { error: "Payment required to access deliverables" },
        { status: 402 }
      );
    }

    // 6. Get deliverable
    const index = parseInt(fileIndex);
    const deliverable = appointment.deliverables?.[index];

    if (!deliverable) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // 7. Stream the file from local storage (path is stored relative to the
    // uploads root, e.g. "deliverables/<uuid>.pdf")
    const absolutePath = resolveUploadPath(deliverable.path);
    if (!absolutePath) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    let data: Buffer;
    try {
      data = await readFile(absolutePath);
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const safeName = String(deliverable.name || "download").replace(/["\\\r\n]/g, "");
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": contentTypeFor(absolutePath),
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Deliverable download error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
