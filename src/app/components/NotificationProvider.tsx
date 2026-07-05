"use client";

import { useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { toast } from "react-toastify";
import { auth, db } from "../firebase";
import { useUserStore } from "../store/userStore";

// Digest of the notification-relevant parts of an appointment, kept per id so
// snapshot diffs can tell WHAT changed rather than just that something did.
type Digest = {
  status: string;
  adminMessages: number;
  userMessages: number;
  deliverables: number;
  paymentStatus: string;
};

function digest(data: Record<string, unknown>): Digest {
  const messages = (data.messages as { sender: string }[] | undefined) || [];
  return {
    status: (data.status as string) || "pending",
    adminMessages: messages.filter((m) => m.sender === "admin").length,
    userMessages: messages.filter((m) => m.sender === "user").length,
    deliverables: ((data.deliverables as unknown[] | undefined) || []).length,
    paymentStatus:
      ((data.payment as { status?: string } | undefined) || {}).status || "none",
  };
}

// Cross-tab, persistent dedupe: a given event key notifies at most once,
// no matter how often listeners resubscribe, tabs reload, or components
// remount. localStorage is shared across tabs, so two admin tabs won't both
// announce the same event.
const SEEN_KEY = "ata-notified-events";

function markSeen(eventKey: string): boolean {
  try {
    const seen: string[] = JSON.parse(localStorage.getItem(SEEN_KEY) || "[]");
    if (seen.includes(eventKey)) return false;
    seen.push(eventKey);
    localStorage.setItem(SEEN_KEY, JSON.stringify(seen.slice(-500)));
    return true;
  } catch {
    return true; // storage unavailable — better to notify than stay silent
  }
}

function showNotification(title: string, body: string) {
  toast.info(`${title} — ${body}`);
  try {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/logo.png" });
    }
  } catch {
    // Notification constructor can throw on some platforms; the toast covers it
  }
}

export default function NotificationProvider() {
  const [user] = useAuthState(auth);
  const { role, fetchUserRole } = useUserStore();

  // Ask for browser-notification permission once the user signs in
  useEffect(() => {
    if (!user) return;
    if (user.email) fetchUserRole(user.email);
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        Notification.requestPermission();
      }
    } catch {
      // Notifications unsupported — toasts still work
    }
  }, [user, fetchUserRole]);

  useEffect(() => {
    if (!user) return;

    const isAdmin = role === "admin" || role === "superadmin";
    const q = isAdmin
      ? query(collection(db, "appointments"))
      : query(collection(db, "appointments"), where("userId", "==", user.uid));

    // All diff state is local to THIS subscription: a late-firing callback
    // from a previous (unsubscribed) listener can't poison the baseline of
    // the new one — that race is what caused repeated "new booking" spam.
    let active = true;
    let baselineReady = false;
    let prev = new Map<string, Digest>();

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!active) return;

      const next = new Map<string, Digest>();
      // Notifications are queued per snapshot, then flood-gated: a burst
      // (e.g. after reconnect) collapses into one summary toast instead of
      // stacking ten on screen.
      const queue: { key: string; title: string; body: string }[] = [];
      const notify = (key: string, title: string, body: string) =>
        queue.push({ key, title, body });

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const current = digest(data);
        next.set(docSnap.id, current);

        if (!baselineReady) return;

        const id = docSnap.id;
        const itemName = (data.itemName as string) || "your booking";
        const customer = (data.name as string) || "A customer";
        const before = prev.get(id);

        if (isAdmin) {
          if (!before) {
            // Only genuinely fresh documents count as new bookings — guards
            // against any resubscription burst surfacing old appointments
            const createdAt =
              (data.createdAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;
            if (Date.now() - createdAt < 10 * 60 * 1000) {
              notify(`booking|${id}`, "New booking", `${customer} booked ${itemName}`);
            }
            return;
          }
          if (current.userMessages > before.userMessages) {
            notify(
              `umsg|${id}|${current.userMessages}`,
              "New customer message",
              `${customer} · ${itemName}`
            );
          }
          if (current.status === "documents_uploaded" && before.status !== "documents_uploaded") {
            notify(
              `docs|${id}|${current.status}|${before.status}`,
              "Documents uploaded",
              `${customer} · ${itemName}`
            );
          }
          if (current.paymentStatus === "succeeded" && before.paymentStatus !== "succeeded") {
            notify(`paid|${id}`, "Payment received", `${customer} · ${itemName}`);
          }
        } else {
          if (!before) return; // user created it themselves
          if (current.adminMessages > before.adminMessages) {
            notify(
              `amsg|${id}|${current.adminMessages}`,
              "New message",
              `The team replied about ${itemName}`
            );
          }
          if (current.status !== before.status) {
            const statusKey = `status|${id}|${current.status}`;
            switch (current.status) {
              case "documents_requested":
                notify(statusKey, "Documents requested", `Please upload documents for ${itemName}`);
                break;
              case "pending":
                if (before.status === "payment_pending") {
                  notify(statusKey, "Payment confirmed", `${itemName} is now pending review`);
                }
                break;
              case "approved":
                notify(statusKey, "Application approved", `${itemName} has been approved`);
                break;
              case "completed":
                notify(statusKey, "Booking complete", `${itemName} is complete — check your deliverables`);
                break;
              case "rejected":
                notify(statusKey, "Booking update", `${itemName} was rejected — contact us for details`);
                break;
              default:
                notify(
                  statusKey,
                  "Status update",
                  `${itemName} is now ${current.status.replace(/_/g, " ")}`
                );
            }
          }
          if (current.deliverables > before.deliverables) {
            notify(
              `deliv|${id}|${current.deliverables}`,
              "New deliverable",
              `A file is ready for download on ${itemName}`
            );
          }
        }
      });

      prev = next;
      baselineReady = true;

      // Dedupe against everything already announced (any tab, any session),
      // then flood-gate what's left
      const fresh = queue.filter((n) => markSeen(n.key));
      if (fresh.length > 3) {
        showNotification(
          "Appointment updates",
          `${fresh.length} updates across your appointments`
        );
      } else {
        fresh.forEach((n) => showNotification(n.title, n.body));
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [user, role]);

  return null;
}
