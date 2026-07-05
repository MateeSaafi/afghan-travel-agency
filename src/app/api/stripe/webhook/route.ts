import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  const stripe = getStripe();

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Payment completed at booking -> appointment enters the admin queue
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const appointmentId = session.metadata?.appointmentId;

    if (appointmentId) {
      try {
        const appointmentRef = adminDb.collection("appointments").doc(appointmentId);
        const appointmentDoc = await appointmentRef.get();

        if (appointmentDoc.exists) {
          const appointment = appointmentDoc.data()!;
          const update: Record<string, unknown> = {
            "payment.stripePaymentIntentId": session.payment_intent,
            "payment.status": "succeeded",
            "payment.paidAt": FieldValue.serverTimestamp(),
          };
          // Only advance from payment_pending; if verify-session already
          // flipped it (or admin moved it along), don't regress the status
          if (appointment.status === "payment_pending") {
            update.status = "pending";
          }
          await appointmentRef.update(update);
          console.log(`Payment confirmed for appointment ${appointmentId}`);
        }
      } catch (error) {
        console.error("Error updating appointment after payment:", error);
        return NextResponse.json(
          { error: "Failed to update appointment" },
          { status: 500 }
        );
      }
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const appointmentId = session.metadata?.appointmentId;

    if (appointmentId) {
      try {
        const appointmentRef = adminDb.collection("appointments").doc(appointmentId);
        const appointmentDoc = await appointmentRef.get();

        if (appointmentDoc.exists) {
          const appointment = appointmentDoc.data();
          // Appointment stays payment_pending so the user can retry from
          // My Appointments; just mark the session as expired
          if (appointment?.status === "payment_pending") {
            await appointmentRef.update({ "payment.status": "expired" });
            console.log(`Checkout expired for appointment ${appointmentId}`);
          }
        }
      } catch (error) {
        console.error("Error handling expired session:", error);
      }
    }
  }

  return NextResponse.json({ received: true });
}
