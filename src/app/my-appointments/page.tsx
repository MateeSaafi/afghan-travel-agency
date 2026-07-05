"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  Timestamp,
} from "firebase/firestore";
import { uploadFile } from "../lib/uploadFile";
import { toast } from "react-toastify";
import Footer from "../components/Footer";
import {
  Calendar,
  FileText,
  Upload,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Package,
  ChevronRight,
  CreditCard,
  Download,
  Clock,
} from "lucide-react";

type Message = {
  sender: "admin" | "user";
  content: string;
  timestamp: Timestamp;
};

type Document = {
  name: string;
  url: string;
  uploadedAt: Timestamp;
};

type Deliverable = {
  name: string;
  path: string;
  uploadedAt: Timestamp;
  type: "visa" | "ticket" | "document" | "other";
};

type Payment = {
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "expired";
  paidAt?: Timestamp;
};

type Appointment = {
  id: string;
  itemId: string;
  itemName?: string;
  name: string;
  email: string;
  phone: string;
  notes?: string;
  status:
    | "pending"
    | "processing"
    | "documents_requested"
    | "documents_uploaded"
    | "approved"
    | "payment_pending"
    | "paid"
    | "completed"
    | "rejected";
  createdAt: Timestamp;
  messages: Message[];
  documents: Document[];
  requestedDocs?: string[];
  adminNote?: string;
  deliverables?: Deliverable[];
  payment?: Payment;
  approvedPrice?: number;
};

const statusConfig = {
  pending: {
    label: "Pending Review",
    color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  },
  processing: {
    label: "Processing",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  documents_requested: {
    label: "Documents Needed",
    color: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
  documents_uploaded: {
    label: "Under Review",
    color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  approved: {
    label: "Approved",
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  payment_pending: {
    label: "Awaiting Payment",
    color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  paid: {
    label: "Paid",
    color: "bg-green-500/10 text-green-400 border-green-500/20",
  },
  completed: {
    label: "Completed",
    color: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-500/10 text-red-400 border-red-500/20",
  },
};

export default function MyAppointments() {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [initiatingPayment, setInitiatingPayment] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "appointments"),
      where("userId", "==", user.uid),
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const appointmentsArr: Appointment[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        appointmentsArr.push({
          id: docSnap.id,
          itemId: data.itemId,
          itemName: data.itemName,
          name: data.name,
          email: data.email,
          phone: data.phone,
          notes: data.notes,
          status: data.status || "pending",
          createdAt: data.createdAt,
          messages: data.messages || [],
          documents: data.documents || [],
          requestedDocs: data.requestedDocs || [],
          adminNote: data.adminNote,
          deliverables: data.deliverables || [],
          payment: data.payment,
          approvedPrice: data.approvedPrice,
        });
      }

      // Sort by createdAt descending
      appointmentsArr.sort((a, b) => {
        const aTime = a.createdAt?.toMillis() || 0;
        const bTime = b.createdAt?.toMillis() || 0;
        return bTime - aTime;
      });

      setAppointments(appointmentsArr);
      setLoadingData(false);

      // Update selected appointment if it's open
      if (selectedAppointment) {
        const updated = appointmentsArr.find(
          (a) => a.id === selectedAppointment.id,
        );
        if (updated) setSelectedAppointment(updated);
      }
    });

    return () => unsubscribe();
  }, [user, selectedAppointment?.id]);

  const sendMessage = async () => {
    if (!selectedAppointment || !newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const appointmentRef = doc(db, "appointments", selectedAppointment.id);
      await updateDoc(appointmentRef, {
        messages: arrayUnion({
          sender: "user",
          content: newMessage.trim(),
          timestamp: Timestamp.now(),
        }),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  const uploadDocuments = async (files: File[]) => {
    if (!selectedAppointment || !user || files.length === 0) return;

    setUploadingDoc(true);
    try {
      const idToken = await user.getIdToken();
      const uploadedDocs = [];
      const failed: string[] = [];
      for (const file of files) {
        try {
          const uploaded = await uploadFile(file, "document", idToken);
          uploadedDocs.push({
            name: file.name,
            url: uploaded.url,
            uploadedAt: Timestamp.now(),
          });
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          failed.push(file.name);
        }
      }

      // Only touch Firestore if something actually uploaded — arrayUnion()
      // with zero elements is a silent no-op, so flipping the status here
      // with an empty list would look "successful" while saving nothing.
      if (uploadedDocs.length > 0) {
        const appointmentRef = doc(db, "appointments", selectedAppointment.id);
        await updateDoc(appointmentRef, {
          documents: arrayUnion(...uploadedDocs),
          status: "documents_uploaded",
        });
        toast.success(
          uploadedDocs.length === 1
            ? "Document uploaded"
            : `${uploadedDocs.length} documents uploaded`
        );
      }
      if (failed.length > 0) {
        toast.error(`Failed to upload: ${failed.join(", ")}`);
      }
    } catch (error) {
      console.error("Error uploading documents:", error);
      toast.error("Failed to upload documents. Please try again.");
    } finally {
      setUploadingDoc(false);
    }
  };

  const initiatePayment = async (appointmentId: string) => {
    if (!user) return;
    setInitiatingPayment(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ appointmentId }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.alreadyPaid) {
        // Earlier checkout had already succeeded — the appointment was just
        // submitted; the realtime listener will refresh the UI
      } else {
        console.error("Failed to create checkout session:", data.error);
      }
    } catch (error) {
      console.error("Error initiating payment:", error);
    } finally {
      setInitiatingPayment(false);
    }
  };

  const downloadDeliverable = async (
    appointmentId: string,
    fileIndex: number,
  ) => {
    if (!user) return;
    setDownloadingFile(fileIndex);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(
        `/api/deliverables?appointmentId=${appointmentId}&fileIndex=${fileIndex}`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        },
      );

      if (!response.ok) {
        const data = await response.json();
        console.error("Failed to download deliverable:", data.error);
        return;
      }

      // The API streams the file directly; trigger a browser download
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download =
        selectedAppointment?.deliverables?.[fileIndex]?.name || "download";
      anchor.click();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Error downloading deliverable:", error);
    } finally {
      setDownloadingFile(null);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <main className="pt-24 pb-12 min-h-screen relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(251,146,60,0.05),rgba(255,255,255,0))]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded-full text-zinc-400 text-sm font-medium">
              <Calendar className="w-4 h-4" />
              My Appointments
            </div>
            <h1 className="text-3xl font-bold text-zinc-100">
              Track Your Requests
            </h1>
            <p className="text-zinc-400 mt-2">
              View status, upload documents, and communicate with our team.
            </p>
          </div>

          {appointments.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
              <Package className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h2 className="text-xl font-medium text-zinc-300 mb-2">
                No appointments yet
              </h2>
              <p className="text-zinc-500 mb-6">
                Browse our packages and submit an appointment request.
              </p>
              <button
                onClick={() => router.push("/packages?category=all")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-900 rounded-md font-medium hover:bg-zinc-200 transition-colors"
              >
                Browse Packages
              </button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Appointments List */}
              <div className="lg:col-span-1 space-y-3">
                {appointments.map((appointment) => (
                  <button
                    key={appointment.id}
                    onClick={() => setSelectedAppointment(appointment)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      selectedAppointment?.id === appointment.id
                        ? "bg-zinc-800 border-orange-500/30"
                        : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-zinc-100 truncate">
                          {appointment.itemName || "Package Request"}
                        </h3>
                        <p className="text-sm text-zinc-500 mt-1">
                          {appointment.createdAt?.toDate().toLocaleDateString()}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${statusConfig[appointment.status].color}`}
                        >
                          {statusConfig[appointment.status].label}
                        </span>
                      </div>
                    </div>
                    {appointment.status === "documents_requested" && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-orange-400">
                        <AlertCircle className="w-3 h-3" />
                        Documents required
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Appointment Details */}
              <div className="lg:col-span-2">
                {selectedAppointment ? (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-zinc-100">
                          {selectedAppointment.itemName || "Package Request"}
                        </h2>
                        <p className="text-sm text-zinc-500">
                          Requested on{" "}
                          {selectedAppointment.createdAt
                            ?.toDate()
                            .toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium border ${statusConfig[selectedAppointment.status].color}`}
                      >
                        {statusConfig[selectedAppointment.status].label}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-6">
                      {/* Info */}
                      <div className="space-y-1">
                        <p className="text-xs text-zinc-500 uppercase tracking-wider">
                          Contact Phone
                        </p>
                        <p className="text-sm text-zinc-300">
                          {selectedAppointment.phone}
                        </p>
                      </div>

                      {/* Admin Note */}
                      {selectedAppointment.adminNote && (
                        <div className="p-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg">
                          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                            Note from Admin
                          </p>
                          <p className="text-sm text-zinc-300">
                            {selectedAppointment.adminNote}
                          </p>
                        </div>
                      )}

                      {/* Requested Documents — stays visible after the first
                          upload so the user can add the remaining files */}
                      {(selectedAppointment.status === "documents_requested" ||
                        selectedAppointment.status === "documents_uploaded") &&
                        selectedAppointment.requestedDocs &&
                        selectedAppointment.requestedDocs.length > 0 && (
                          <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-3">
                              <FileText className="w-4 h-4 text-orange-400" />
                              <h3 className="font-medium text-orange-400">
                                {selectedAppointment.status ===
                                "documents_requested"
                                  ? "Documents Requested"
                                  : "Add More Documents"}
                              </h3>
                            </div>
                            <ul className="space-y-2 mb-4">
                              {selectedAppointment.requestedDocs.map(
                                (docName, idx) => (
                                  <li
                                    key={idx}
                                    className="flex items-center gap-2 text-sm text-zinc-300"
                                  >
                                    <ChevronRight className="w-3 h-3 text-zinc-500" />
                                    {docName}
                                  </li>
                                ),
                              )}
                            </ul>
                            <label className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-400 border border-orange-500/30 rounded-md text-sm font-medium cursor-pointer hover:bg-orange-500/20 transition-colors">
                              <Upload className="w-4 h-4" />
                              {uploadingDoc
                                ? "Uploading..."
                                : "Upload Documents"}
                              <input
                                type="file"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                  // Capture a plain array BEFORE clearing the
                                  // input: e.target.files is a live FileList,
                                  // and resetting .value empties it out from
                                  // under an in-flight async upload.
                                  const files = e.target.files
                                    ? Array.from(e.target.files)
                                    : [];
                                  e.target.value = "";
                                  if (files.length) uploadDocuments(files);
                                }}
                                disabled={uploadingDoc}
                              />
                            </label>
                            <p className="mt-2 text-xs text-zinc-500">
                              You can select several files at once.
                            </p>
                          </div>
                        )}

                      {/* Uploaded Documents */}
                      {selectedAppointment.documents.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            Uploaded Documents
                          </h3>
                          <div className="space-y-2">
                            {selectedAppointment.documents.map((doc, idx) => (
                              <a
                                key={idx}
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg hover:border-zinc-600 transition-colors"
                              >
                                <FileText className="w-4 h-4 text-zinc-400" />
                                <span className="text-sm text-zinc-300 truncate flex-1">
                                  {doc.name}
                                </span>
                                <span className="text-xs text-zinc-500">
                                  {doc.uploadedAt
                                    ?.toDate()
                                    .toLocaleDateString()}
                                </span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Complete Payment Section — booking isn't submitted
                          until the payment goes through */}
                      {selectedAppointment.status === "payment_pending" && (
                        <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-amber-400" />
                            <h3 className="font-medium text-amber-400">
                              Complete Your Payment
                            </h3>
                          </div>
                          <p className="text-sm text-zinc-400">
                            This booking hasn&apos;t been submitted yet — it
                            enters review as soon as your payment completes.
                          </p>
                          <button
                            onClick={() =>
                              initiatePayment(selectedAppointment.id)
                            }
                            disabled={initiatingPayment}
                            className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-md text-sm font-medium hover:bg-amber-500/20 disabled:opacity-50 transition-colors"
                          >
                            {initiatingPayment ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-4 h-4" />
                                Complete Payment
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Deliverables Section */}
                      {(selectedAppointment.status === "paid" ||
                        selectedAppointment.status === "completed" ||
                        (selectedAppointment.deliverables?.length || 0) >
                          0) && (
                        <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            <h3 className="font-medium text-green-400">
                              Your Deliverables
                            </h3>
                          </div>
                          {selectedAppointment.deliverables &&
                          selectedAppointment.deliverables.length > 0 ? (
                            <>
                              <p className="text-sm text-zinc-400 mb-4">
                                Your deliverables are ready for download:
                              </p>
                              <div className="space-y-2">
                                {selectedAppointment.deliverables.map(
                                  (deliverable, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() =>
                                        downloadDeliverable(
                                          selectedAppointment.id,
                                          idx,
                                        )
                                      }
                                      disabled={downloadingFile === idx}
                                      className="w-full flex items-center gap-3 p-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg hover:border-green-500/30 hover:bg-zinc-800 transition-colors text-left"
                                    >
                                      <Download className="w-4 h-4 text-green-400 shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <span className="text-sm text-zinc-300 truncate block">
                                          {deliverable.name}
                                        </span>
                                        <span className="text-xs text-zinc-500 capitalize">
                                          {deliverable.type}
                                        </span>
                                      </div>
                                      {downloadingFile === idx ? (
                                        <Loader2 className="w-4 h-4 text-zinc-400 animate-spin shrink-0" />
                                      ) : (
                                        <span className="text-xs text-green-400 shrink-0">
                                          Download
                                        </span>
                                      )}
                                    </button>
                                  ),
                                )}
                              </div>
                            </>
                          ) : (
                            <p className="text-sm text-zinc-400">
                              Your payment has been received. Our team will
                              upload your deliverables shortly.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Messages */}
                      <div>
                        <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-zinc-400" />
                          Messages
                        </h3>
                        <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                          {selectedAppointment.messages.length === 0 ? (
                            <p className="text-sm text-zinc-500 text-center py-4">
                              No messages yet
                            </p>
                          ) : (
                            selectedAppointment.messages.map((msg, idx) => (
                              <div
                                key={idx}
                                className={`p-3 rounded-lg ${
                                  msg.sender === "user"
                                    ? "bg-zinc-800 ml-8"
                                    : "bg-zinc-800/50 border border-zinc-700/50 mr-8"
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span
                                    className={`text-xs font-medium ${
                                      msg.sender === "user"
                                        ? "text-zinc-400"
                                        : "text-orange-400"
                                    }`}
                                  >
                                    {msg.sender === "user" ? "You" : "Admin"}
                                  </span>
                                  <span className="text-xs text-zinc-600">
                                    {msg.timestamp?.toDate().toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm text-zinc-300">
                                  {msg.content}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-md py-2 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                              }
                            }}
                          />
                          <button
                            onClick={sendMessage}
                            disabled={sendingMessage || !newMessage.trim()}
                            className="px-3 py-2 bg-zinc-100 text-zinc-900 rounded-md hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {sendingMessage ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
                    <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                    <h2 className="text-lg font-medium text-zinc-300">
                      Select an appointment
                    </h2>
                    <p className="text-zinc-500 mt-1">
                      Click on an appointment to view details
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
