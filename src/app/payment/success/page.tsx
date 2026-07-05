"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase";
import { CheckCircle2, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function PaymentSuccess() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [user, loadingAuth] = useAuthState(auth);
  const [state, setState] = useState<"verifying" | "confirmed" | "unconfirmed">(
    "verifying"
  );

  // Confirm the payment directly with Stripe so the appointment moves to
  // "pending" even when no webhook forwarding is running (local demo)
  useEffect(() => {
    if (loadingAuth) return;
    if (!user || !sessionId) {
      setState("unconfirmed");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const idToken = await user.getIdToken();
        const response = await fetch("/api/stripe/verify-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ sessionId }),
        });
        const data = await response.json();
        if (!cancelled) {
          setState(response.ok && data.paid ? "confirmed" : "unconfirmed");
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        if (!cancelled) setState("unconfirmed");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, loadingAuth, sessionId]);

  if (state === "verifying") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-zinc-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Confirming your payment...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="max-w-md w-full mx-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
          {state === "confirmed" ? (
            <>
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h1 className="text-2xl font-bold text-zinc-100 mb-2">
                Payment Successful!
              </h1>
              <p className="text-zinc-400 mb-6">
                Your booking is confirmed and now pending review. Our team will
                process your request and contact you if any documents are
                needed.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-amber-500" />
              </div>
              <h1 className="text-2xl font-bold text-zinc-100 mb-2">
                Payment Received
              </h1>
              <p className="text-zinc-400 mb-6">
                We couldn&apos;t automatically confirm your payment status just
                now. Check My Appointments in a moment — if it still shows
                &quot;Awaiting Payment&quot;, contact us on WhatsApp.
              </p>
            </>
          )}
          <Link
            href="/my-appointments"
            className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-100 text-zinc-900 rounded-lg font-medium hover:bg-zinc-200 transition-colors"
          >
            View My Appointments
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
