import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";
import { verifyBearerToken } from "@/lib/api-auth";
import { FieldValue } from "firebase-admin/firestore";

// Webhook fallback for local demos: the payment success page calls this with
// the Checkout session id, and we confirm the payment directly with Stripe.
// This makes the flow work without `stripe listen` forwarding webhooks.
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyBearerToken(request);
    if (!auth.ok) return auth.response;

    const { sessionId } = await request.json();
    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const appointmentId = session.metadata?.appointmentId;
    if (!appointmentId) {
      return NextResponse.json({ error: "Unknown session" }, { status: 404 });
    }

    const appointmentRef = adminDb.collection("appointments").doc(appointmentId);
    const appointmentDoc = await appointmentRef.get();
    if (!appointmentDoc.exists) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }
    const appointment = appointmentDoc.data()!;

    if (appointment.userId !== auth.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (session.payment_status !== "paid") {
      return NextResponse.json({ paid: false, status: appointment.status });
    }

    // Idempotent: only advance from payment_pending (the webhook may have
    // already done this, or may do it again later — both are safe no-ops)
    if (appointment.status === "payment_pending") {
      await appointmentRef.update({
        status: "pending",
        "payment.stripePaymentIntentId": session.payment_intent,
        "payment.status": "succeeded",
        "payment.paidAt": FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ paid: true, status: "pending" });
    }

    return NextResponse.json({ paid: true, status: appointment.status });
  } catch (error) {
    console.error("Verify session error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
