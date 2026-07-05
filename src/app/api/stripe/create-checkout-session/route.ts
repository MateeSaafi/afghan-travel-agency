import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";
import { verifyBearerToken } from "@/lib/api-auth";
import { FieldValue } from "firebase-admin/firestore";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(request: NextRequest) {
  try {
    // 1. Verify Firebase ID token from Authorization header
    const auth = await verifyBearerToken(request);
    if (!auth.ok) return auth.response;
    const userId = auth.uid;

    // 2. Get appointment ID from request body
    const { appointmentId } = await request.json();
    if (!appointmentId) {
      return NextResponse.json({ error: "Missing appointmentId" }, { status: 400 });
    }

    // 3. Fetch appointment and verify ownership + status
    const appointmentRef = adminDb.collection("appointments").doc(appointmentId);
    const appointmentDoc = await appointmentRef.get();

    if (!appointmentDoc.exists) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const appointment = appointmentDoc.data()!;

    if (appointment.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Payment happens at booking: only unpaid appointments can be checked out
    if (appointment.status !== "payment_pending") {
      return NextResponse.json(
        { error: "Appointment is already paid" },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    // 4. If a previous checkout for this appointment was already paid (user
    // closed the tab before reaching the success page), don't charge again —
    // confirm the old session and submit the booking instead
    const existingSessionId = appointment.payment?.stripeSessionId;
    if (existingSessionId) {
      try {
        const existing = await stripe.checkout.sessions.retrieve(existingSessionId);
        if (existing.payment_status === "paid") {
          await appointmentRef.update({
            status: "pending",
            "payment.stripePaymentIntentId": existing.payment_intent,
            "payment.status": "succeeded",
            "payment.paidAt": FieldValue.serverTimestamp(),
          });
          return NextResponse.json({ alreadyPaid: true });
        }
      } catch {
        // Stale or invalid session id — fall through and create a new one
      }
    }

    // 5. Price always comes from the package's listed price
    if (!appointment.itemId) {
      return NextResponse.json({ error: "Missing package" }, { status: 400 });
    }
    const itemDoc = await adminDb.collection("items").doc(appointment.itemId).get();
    const price = itemDoc.exists ? itemDoc.data()?.price || 0 : 0;

    if (!price || price <= 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }

    // 6. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: appointment.itemName || "Travel Package",
              description: `Appointment #${appointmentId.slice(0, 8)}`,
            },
            unit_amount: Math.round(price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/payment/cancel?appointment_id=${appointmentId}`,
      metadata: {
        appointmentId,
        userId,
      },
      customer_email: appointment.email,
    });

    // 7. Record session info on the appointment (status stays payment_pending
    // until the webhook or verify-session confirms the payment)
    await appointmentRef.update({
      payment: {
        stripeSessionId: session.id,
        amount: Math.round(price * 100),
        currency: "usd",
        status: "pending",
        createdAt: FieldValue.serverTimestamp(),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Create checkout session error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
