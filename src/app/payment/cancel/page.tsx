"use client";

import { useSearchParams } from "next/navigation";
import { XCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function PaymentCancel() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointment_id");

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="max-w-md w-full mx-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 mb-2">
            Payment Cancelled
          </h1>
          <p className="text-zinc-400 mb-6">
            Your payment was cancelled. Don&apos;t worry - you can try again
            anytime from your appointments page.
          </p>
          {appointmentId && (
            <p className="text-xs text-zinc-600 mb-6">
              Appointment: {appointmentId.slice(0, 8)}...
            </p>
          )}
          <Link
            href="/my-appointments"
            className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-100 text-zinc-900 rounded-lg font-medium hover:bg-zinc-200 transition-colors"
          >
            Back to Appointments
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
