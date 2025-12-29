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
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
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

type Appointment = {
  id: string;
  itemId: string;
  itemName?: string;
  name: string;
  email: string;
  phone: string;
  notes?: string;
  status: "pending" | "processing" | "documents_requested" | "documents_uploaded" | "approved" | "rejected";
  createdAt: Timestamp;
  messages: Message[];
  documents: Document[];
  requestedDocs?: string[];
  adminNote?: string;
};

const statusConfig = {
  pending: { label: "Pending", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  processing: { label: "Processing", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  documents_requested: { label: "Documents Needed", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  documents_uploaded: { label: "Under Review", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  approved: { label: "Approved", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export default function MyAppointments() {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const storage = getStorage();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "appointments"),
      where("userId", "==", user.uid)
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
        const updated = appointmentsArr.find(a => a.id === selectedAppointment.id);
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

  const uploadDocument = async (file: File) => {
    if (!selectedAppointment) return;

    setUploadingDoc(true);
    try {
      const storageRef = ref(storage, `documents/${selectedAppointment.id}/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      const appointmentRef = doc(db, "appointments", selectedAppointment.id);
      await updateDoc(appointmentRef, {
        documents: arrayUnion({
          name: file.name,
          url: downloadUrl,
          uploadedAt: Timestamp.now(),
        }),
        status: "documents_uploaded",
      });
    } catch (error) {
      console.error("Error uploading document:", error);
    } finally {
      setUploadingDoc(false);
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
            <h1 className="text-3xl font-bold text-zinc-100">Track Your Requests</h1>
            <p className="text-zinc-400 mt-2">View status, upload documents, and communicate with our team.</p>
          </div>

          {appointments.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
              <Package className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h2 className="text-xl font-medium text-zinc-300 mb-2">No appointments yet</h2>
              <p className="text-zinc-500 mb-6">Browse our packages and submit an appointment request.</p>
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
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${statusConfig[appointment.status].color}`}>
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
                          Requested on {selectedAppointment.createdAt?.toDate().toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium border ${statusConfig[selectedAppointment.status].color}`}>
                        {statusConfig[selectedAppointment.status].label}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-6">
                      {/* Info */}
                      <div className="space-y-1">
                        <p className="text-xs text-zinc-500 uppercase tracking-wider">Contact Phone</p>
                        <p className="text-sm text-zinc-300">{selectedAppointment.phone}</p>
                      </div>

                      {/* Admin Note */}
                      {selectedAppointment.adminNote && (
                        <div className="p-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg">
                          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Note from Admin</p>
                          <p className="text-sm text-zinc-300">{selectedAppointment.adminNote}</p>
                        </div>
                      )}

                      {/* Requested Documents */}
                      {selectedAppointment.status === "documents_requested" && selectedAppointment.requestedDocs && selectedAppointment.requestedDocs.length > 0 && (
                        <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <FileText className="w-4 h-4 text-orange-400" />
                            <h3 className="font-medium text-orange-400">Documents Requested</h3>
                          </div>
                          <ul className="space-y-2 mb-4">
                            {selectedAppointment.requestedDocs.map((docName, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-sm text-zinc-300">
                                <ChevronRight className="w-3 h-3 text-zinc-500" />
                                {docName}
                              </li>
                            ))}
                          </ul>
                          <label className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-400 border border-orange-500/30 rounded-md text-sm font-medium cursor-pointer hover:bg-orange-500/20 transition-colors">
                            <Upload className="w-4 h-4" />
                            {uploadingDoc ? "Uploading..." : "Upload Document"}
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadDocument(file);
                              }}
                              disabled={uploadingDoc}
                            />
                          </label>
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
                                <span className="text-sm text-zinc-300 truncate flex-1">{doc.name}</span>
                                <span className="text-xs text-zinc-500">
                                  {doc.uploadedAt?.toDate().toLocaleDateString()}
                                </span>
                              </a>
                            ))}
                          </div>
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
                            <p className="text-sm text-zinc-500 text-center py-4">No messages yet</p>
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
                                  <span className={`text-xs font-medium ${
                                    msg.sender === "user" ? "text-zinc-400" : "text-orange-400"
                                  }`}>
                                    {msg.sender === "user" ? "You" : "Admin"}
                                  </span>
                                  <span className="text-xs text-zinc-600">
                                    {msg.timestamp?.toDate().toLocaleString()}
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
                    <h2 className="text-lg font-medium text-zinc-300">Select an appointment</h2>
                    <p className="text-zinc-500 mt-1">Click on an appointment to view details</p>
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
