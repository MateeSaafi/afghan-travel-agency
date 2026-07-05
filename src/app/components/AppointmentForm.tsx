"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { addDoc, collection, Timestamp, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  Calendar,
  Loader2,
  AlertCircle,
  CreditCard,
  LogIn,
} from "lucide-react";

interface AppointmentFormProps {
  itemId: string;
  itemName?: string;
  price?: number;
}

export default function AppointmentForm({
  itemId,
  itemName,
  price,
}: AppointmentFormProps) {
  const [user, loadingAuth] = useAuthState(auth);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch user's full name from Firestore when user is logged in
  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.email) {
        try {
          // Try to get user document from Firestore
          const userQuery = await getDoc(doc(db, "users", user.uid));
          if (userQuery.exists()) {
            const userData = userQuery.data();
            // Auto-fill name if it exists in the user profile
            if (userData.name) {
              setName(userData.name);
            } else if (user.displayName) {
              // Fallback to Firebase Auth displayName
              setName(user.displayName);
            }
          } else if (user.displayName) {
            // If no Firestore document, use Firebase Auth displayName
            setName(user.displayName);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          // Fallback to Firebase Auth displayName if available
          if (user.displayName) {
            setName(user.displayName);
          }
        }
      }
    };

    fetchUserData();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setMessage("");

    try {
      // 1. Create the appointment as unpaid; it only reaches the admin
      // queue ("pending") once Stripe confirms the payment
      const appointmentData = {
        userId: user.uid,
        userEmail: user.email,
        itemId,
        itemName: itemName || null,
        name,
        email: user.email,
        phone,
        notes,
        status: "payment_pending",
        createdAt: Timestamp.now(),
        messages: [],
        documents: [],
        requestedDocs: [],
      };

      const docRef = await addDoc(collection(db, "appointments"), appointmentData);

      // 2. Create the Stripe Checkout session and redirect to payment
      const idToken = await user.getIdToken();
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ appointmentId: docRef.id }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
        return; // keep the button in loading state during the redirect
      }

      console.error("Failed to create checkout session:", data.error);
      setMessage(
        "Your request was saved, but the payment page could not be opened. " +
          "You can complete the payment anytime from My Appointments."
      );
    } catch (e) {
      console.error("Error creating appointment: ", e);
      setMessage("Failed to start your booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!loadingAuth && !user) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-zinc-400" />
          <h2 className="text-lg font-semibold text-zinc-100">
            Book This Package
          </h2>
        </div>
        <p className="text-sm text-zinc-400 mb-4">
          Sign in to book this package and pay securely with card.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-4 py-2.5 rounded-md font-medium transition-colors"
        >
          <LogIn className="w-4 h-4" />
          Sign In to Book
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-5 h-5 text-zinc-400" />
        <h2 className="text-lg font-semibold text-zinc-100">
          Book This Package
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="John Doe"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-md py-2 px-3 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
            />
            {user && name && (
              <p className="text-xs text-zinc-500 mt-1">
                Auto-filled from your profile
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Email
            </label>
            <div className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-md py-2 px-3 text-zinc-400 text-sm">
              {user?.email}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            placeholder="+93 700 000 000"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md py-2 px-3 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Additional Notes <span className="text-zinc-500">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any specific requirements or questions..."
            rows={3}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md py-2 px-3 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors resize-none"
          />
        </div>

        {message && (
          <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{message}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || loadingAuth}
          className="w-full inline-flex items-center justify-center gap-2 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 rounded-md font-medium transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Redirecting to payment...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              {typeof price === "number" && price > 0
                ? `Book & Pay $${price.toFixed(2)}`
                : "Book & Pay"}
            </>
          )}
        </button>
        <p className="text-xs text-zinc-500 text-center">
          You&apos;ll be redirected to Stripe to pay securely. Your request
          enters review as soon as payment completes.
        </p>
      </form>
    </div>
  );
}
