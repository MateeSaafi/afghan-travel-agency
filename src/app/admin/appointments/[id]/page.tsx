"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db } from "../../../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  doc,
  updateDoc,
  onSnapshot,
  arrayUnion,
  Timestamp,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { useUserStore } from "../../../store/userStore";
import { uploadFile } from "../../../lib/uploadFile";
import {
  ArrowLeft,
  Send,
  FileText,
  MessageSquare,
  CheckCircle2,
  Loader2,
  Upload,
  CreditCard,
  Download,
  Trash2,
} from "lucide-react";

type Message = {
  sender: "admin" | "user";
  content: string;
  timestamp: Timestamp;
};

type DocumentType = {
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
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "expired";
  paidAt?: Timestamp;
};

type Appointment = {
  id: string;
  name: string;
  email: string;
  itemId: string;
  itemName?: string;
  phone: string;
  notes?: string;
  status: "pending" | "processing" | "documents_requested" | "documents_uploaded" | "approved" | "payment_pending" | "paid" | "completed" | "rejected";
  createdAt: Timestamp;
  messages: Message[];
  documents: DocumentType[];
  requestedDocs?: string[];
  adminNote?: string;
  deliverables?: Deliverable[];
  payment?: Payment;
  approvedPrice?: number;
};

const statusConfig = {
  pending: { label: "Pending", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  processing: { label: "Processing", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  documents_requested: { label: "Docs Needed", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  documents_uploaded: { label: "Under Review", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  approved: { label: "Approved", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  payment_pending: { label: "Payment Pending", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  paid: { label: "Paid", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  completed: { label: "Completed", color: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const deliverableTypes = [
  { value: "visa", label: "Visa" },
  { value: "ticket", label: "Ticket" },
  { value: "document", label: "Document" },
  { value: "other", label: "Other" },
] as const;

export default function AppointmentDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [user, loadingAuth] = useAuthState(auth);
  const { role, isLoadingRole, fetchUserRole } = useUserStore();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [requestedDocsInput, setRequestedDocsInput] = useState("");
  const [adminNoteInput, setAdminNoteInput] = useState("");
  const [uploadingDeliverable, setUploadingDeliverable] = useState(false);
  const [deliverableType, setDeliverableType] = useState<Deliverable["type"]>("document");
  const [deletingDeliverable, setDeletingDeliverable] = useState<number | null>(null);

  // Fetch user role
  useEffect(() => {
    if (user?.email) {
      fetchUserRole(user.email);
    }
  }, [user, fetchUserRole]);

  // Redirect if not admin
  useEffect(() => {
    if (!loadingAuth && !isLoadingRole) {
      if (!user || (role !== "admin" && role !== "superadmin")) {
        router.replace("/");
      }
    }
  }, [loadingAuth, isLoadingRole, user, role, router]);

  // Listen to appointment changes
  useEffect(() => {
    if (!id) return;

    const unsubscribe = onSnapshot(doc(db, "appointments", id as string), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAppointment({
          id: docSnap.id,
          name: data.name,
          email: data.email,
          itemId: data.itemId,
          itemName: data.itemName,
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
        setRequestedDocsInput(data.requestedDocs?.join(", ") || "");
        setAdminNoteInput(data.adminNote || "");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const updateStatus = async (newStatus: Appointment["status"]) => {
    if (!appointment) return;
    try {
      await updateDoc(doc(db, "appointments", appointment.id), {
        status: newStatus,
      });
      toast.success(`Status updated to ${statusConfig[newStatus].label}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
    }
  };

  const uploadDeliverable = async (file: File) => {
    if (!appointment || !user) return;

    setUploadingDeliverable(true);
    try {
      const idToken = await user.getIdToken();
      const uploaded = await uploadFile(file, "deliverable", idToken);

      await updateDoc(doc(db, "appointments", appointment.id), {
        deliverables: arrayUnion({
          name: file.name,
          path: uploaded.path,
          uploadedAt: Timestamp.now(),
          type: deliverableType,
        }),
      });
      toast.success("Deliverable uploaded successfully");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
    } finally {
      setUploadingDeliverable(false);
    }
  };

  const deleteDeliverable = async (index: number) => {
    if (!appointment || !appointment.deliverables) return;

    setDeletingDeliverable(index);
    try {
      const updatedDeliverables = appointment.deliverables.filter((_, i) => i !== index);
      await updateDoc(doc(db, "appointments", appointment.id), {
        deliverables: updatedDeliverables,
      });
      toast.success("Deliverable removed");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
    } finally {
      setDeletingDeliverable(null);
    }
  };

  const sendMessage = async () => {
    if (!appointment || !newMessage.trim()) return;

    setSendingMessage(true);
    try {
      await updateDoc(doc(db, "appointments", appointment.id), {
        messages: arrayUnion({
          sender: "admin",
          content: newMessage.trim(),
          timestamp: Timestamp.now(),
        }),
      });
      setNewMessage("");
      toast.success("Message sent");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
    } finally {
      setSendingMessage(false);
    }
  };

  const requestDocuments = async () => {
    if (!appointment || !requestedDocsInput.trim()) return;

    try {
      const docs = requestedDocsInput.split(",").map(d => d.trim()).filter(Boolean);
      await updateDoc(doc(db, "appointments", appointment.id), {
        requestedDocs: docs,
        status: "documents_requested",
        adminNote: adminNoteInput.trim() || null,
      });
      toast.success("Document request sent");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
    }
  };

  if (loading || loadingAuth || isLoadingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950">
        <h1 className="text-2xl font-bold text-zinc-100 mb-2">Appointment Not Found</h1>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-900 rounded-md font-medium hover:bg-zinc-200 transition-colors mt-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pt-14">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-100">
                {appointment.itemName || "Appointment Details"}
              </h1>
              <p className="text-zinc-400 mt-1">
                {appointment.name} - {appointment.email}
              </p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium border ${statusConfig[appointment.status].color}`}>
              {statusConfig[appointment.status].label}
            </span>
          </div>
        </div>

        <div className="space-y-6">
          {/* Status & Info */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Phone</p>
                  <p className="text-sm text-zinc-300">{appointment.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Created</p>
                  <p className="text-sm text-zinc-300">
                    {appointment.createdAt?.toDate?.()?.toLocaleString() || "N/A"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {(["pending", "processing", "approved", "completed", "rejected"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => updateStatus(status)}
                      disabled={appointment.status === status}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        status === "approved"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                          : status === "completed"
                          ? "bg-teal-500/10 text-teal-400 border-teal-500/30 hover:bg-teal-500/20"
                          : status === "rejected"
                          ? "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20"
                          : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
                      }`}
                    >
                      {statusConfig[status].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Customer Notes */}
          {appointment.notes && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Customer Notes</p>
              <p className="text-sm text-zinc-300">{appointment.notes}</p>
            </div>
          )}

          {/* Request Documents */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-orange-400" />
              <h2 className="font-medium text-zinc-200">Request Documents</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">
                  Documents (comma-separated)
                </label>
                <input
                  type="text"
                  value={requestedDocsInput}
                  onChange={(e) => setRequestedDocsInput(e.target.value)}
                  placeholder="Passport, ID Card, Bank Statement"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-md py-2 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">
                  Note to customer (optional)
                </label>
                <textarea
                  value={adminNoteInput}
                  onChange={(e) => setAdminNoteInput(e.target.value)}
                  placeholder="Please provide clear scanned copies..."
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-md py-2 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none"
                />
              </div>
              <button
                onClick={requestDocuments}
                disabled={!requestedDocsInput.trim()}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FileText size={14} />
                Send Document Request
              </button>
            </div>
          </div>

          {/* Uploaded Documents */}
          {appointment.documents.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <h2 className="font-medium text-zinc-200">Uploaded Documents</h2>
              </div>
              <div className="space-y-2">
                {appointment.documents.map((doc, idx) => (
                  <a
                    key={idx}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg hover:border-zinc-600 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm text-zinc-300 truncate flex-1">{doc.name}</span>
                    <span className="text-xs text-zinc-500">
                      {doc.uploadedAt?.toDate?.()?.toLocaleDateString() || ""}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Payment Info */}
          {appointment.payment && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-4 h-4 text-green-400" />
                <h2 className="font-medium text-zinc-200">Payment Information</h2>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Amount</p>
                  <p className="text-sm text-zinc-300">
                    ${((appointment.payment.amount || 0) / 100).toFixed(2)} {appointment.payment.currency?.toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Status</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    appointment.payment.status === "succeeded"
                      ? "bg-green-500/10 text-green-400"
                      : appointment.payment.status === "pending"
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-red-500/10 text-red-400"
                  }`}>
                    {appointment.payment.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Paid At</p>
                  <p className="text-sm text-zinc-300">
                    {appointment.payment.paidAt?.toDate?.()?.toLocaleString() || "Pending"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Upload Deliverables - available once the booking is paid */}
          {(appointment.payment?.status === "succeeded" ||
            appointment.status === "paid" ||
            appointment.status === "completed") && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="w-4 h-4 text-green-400" />
                <h2 className="font-medium text-zinc-200">Upload Deliverables</h2>
              </div>
              <p className="text-sm text-zinc-400 mb-4">
                Upload visa, tickets, or other documents for the customer to download.
              </p>
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Type</label>
                  <select
                    value={deliverableType}
                    onChange={(e) => setDeliverableType(e.target.value as Deliverable["type"])}
                    className="bg-zinc-950 border border-zinc-700 rounded-md py-2 px-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  >
                    {deliverableTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/30 rounded-md text-sm font-medium cursor-pointer hover:bg-green-500/20 transition-colors">
                  <Upload className="w-4 h-4" />
                  {uploadingDeliverable ? "Uploading..." : "Upload File"}
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadDeliverable(file);
                    }}
                    disabled={uploadingDeliverable}
                  />
                </label>
              </div>

              {/* Uploaded Deliverables List */}
              {appointment.deliverables && appointment.deliverables.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-zinc-300 mb-3">Uploaded Deliverables</h3>
                  <div className="space-y-2">
                    {appointment.deliverables.map((deliverable, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg"
                      >
                        <Download className="w-4 h-4 text-green-400" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-zinc-300 truncate block">{deliverable.name}</span>
                          <span className="text-xs text-zinc-500 capitalize">{deliverable.type}</span>
                        </div>
                        <span className="text-xs text-zinc-500">
                          {deliverable.uploadedAt?.toDate?.()?.toLocaleDateString() || ""}
                        </span>
                        <button
                          onClick={() => deleteDeliverable(idx)}
                          disabled={deletingDeliverable === idx}
                          className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
                          title="Remove deliverable"
                        >
                          {deletingDeliverable === idx ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-zinc-400" />
              <h2 className="font-medium text-zinc-200">Messages</h2>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
              {appointment.messages.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-4">No messages yet</p>
              ) : (
                appointment.messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg ${
                      msg.sender === "admin"
                        ? "bg-orange-500/10 border border-orange-500/20 ml-8"
                        : "bg-zinc-800 mr-8"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium ${
                        msg.sender === "admin" ? "text-orange-400" : "text-zinc-400"
                      }`}>
                        {msg.sender === "admin" ? "You" : "Customer"}
                      </span>
                      <span className="text-xs text-zinc-600">
                        {msg.timestamp?.toDate?.()?.toLocaleString() || ""}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-300">{msg.content}</p>
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
                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-md py-2 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600"
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
    </div>
  );
}
