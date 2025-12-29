"use client";

import { useState, useEffect } from "react";
import { addDoc, collection, Timestamp, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { Calendar, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface AppointmentFormProps {
  itemId: string;
  itemName?: string;
}

export default function AppointmentForm({ itemId, itemName }: AppointmentFormProps) {
  const [user, loadingAuth] = useAuthState(auth);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
    setLoading(true);
    setMessage("");

    try {
      const appointmentData = {
        userId: user?.uid || null,
        userEmail: user?.email || email,
        itemId,
        itemName: itemName || null,
        name,
        email: user?.email || email,
        phone,
        notes,
        status: "pending",
        createdAt: Timestamp.now(),
        messages: [],
        documents: [],
        requestedDocs: [],
      };

      await addDoc(collection(db, "appointments"), appointmentData);
      setSuccess(true);
      setMessage("Your appointment request has been submitted. We'll contact you soon!");
    } catch (e) {
      console.error("Error adding document: ", e);
      setMessage("Failed to schedule appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-5 h-5 text-zinc-400" />
        <h2 className="text-lg font-semibold text-zinc-100">Request Appointment</h2>
      </div>

      {success ? (
        <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-emerald-400 font-medium">Request Submitted!</p>
            <p className="text-emerald-400/80 text-sm mt-1">{message}</p>
          </div>
        </div>
      ) : (
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
                disabled={!!(user && name !== "" && loadingAuth)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md py-2 px-3 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              />
              {user && name && (
                <p className="text-xs text-zinc-500 mt-1">Auto-filled from your profile</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Email
              </label>
              {user ? (
                <div className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-md py-2 px-3 text-zinc-400 text-sm">
                  {user.email}
                </div>
              ) : (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md py-2 px-3 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
                />
              )}
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

          {message && !success && (
            <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{message}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 rounded-md font-medium transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Request"
            )}
          </button>
        </form>
      )}
    </div>
  );
}
