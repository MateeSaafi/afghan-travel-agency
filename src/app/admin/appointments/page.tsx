"use client";
import React, { useState, useEffect } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import Link from "next/link";
import { Eye, Filter } from "lucide-react";

type Product = {
  id: string;
  name: string;
};

type AppointmentType = {
  id: string;
  name: string;
  email: string;
  itemId: string;
  itemName?: string;
  phone: string;
  status: "pending" | "processing" | "documents_requested" | "documents_uploaded" | "approved" | "rejected";
  createdAt: any;
};

const statusConfig = {
  pending: { label: "Pending", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  processing: { label: "Processing", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  documents_requested: { label: "Docs Needed", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  documents_uploaded: { label: "Under Review", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  approved: { label: "Approved", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const ITEMS_PER_PAGE = 10;

const AppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<AppointmentType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [appointmentsPage, setAppointmentsPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const q = query(collection(db, "items"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itemsArr: Product[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        name: docSnap.data().name,
      }));
      setProducts(itemsArr);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "appointments"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appointmentsArr: AppointmentType[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const prod = products.find((p) => p.id === data.itemId);
        appointmentsArr.push({
          id: docSnap.id,
          name: data.name,
          email: data.email,
          itemId: data.itemId,
          itemName: prod?.name,
          phone: data.phone,
          status: data.status || "pending",
          createdAt: data.createdAt,
        });
      });
      appointmentsArr.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
      setAppointments(appointmentsArr);
    });
    return () => unsubscribe();
  }, [products]);

  // Filter appointments based on status
  const filteredAppointments = statusFilter === "all"
    ? appointments
    : appointments.filter(app => app.status === statusFilter);

  const appointmentsTotalPages = Math.ceil(filteredAppointments.length / ITEMS_PER_PAGE);
  const paginatedAppointments = filteredAppointments.slice(
    (appointmentsPage - 1) * ITEMS_PER_PAGE,
    appointmentsPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when filter changes
  useEffect(() => {
    setAppointmentsPage(1);
  }, [statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Appointments</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Showing {filteredAppointments.length} of {appointments.length} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-zinc-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 bg-zinc-900 border border-zinc-800 rounded-md px-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition-colors"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="documents_requested">Docs Needed</option>
            <option value="documents_uploaded">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Package</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAppointments.map((appointment) => (
                <tr
                  key={appointment.id}
                  className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-zinc-200">{appointment.itemName || "Unknown"}</div>
                    <div className="text-xs text-zinc-500">{appointment.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-zinc-300">{appointment.name}</div>
                    <div className="text-xs text-zinc-500">{appointment.phone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${statusConfig[appointment.status].color}`}>
                      {statusConfig[appointment.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/appointments/${appointment.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 transition-colors"
                    >
                      <Eye size={12} />
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {appointmentsTotalPages > 1 && (
          <div className="flex justify-between items-center px-4 py-3 border-t border-zinc-800">
            <span className="text-sm text-zinc-500">
              Page {appointmentsPage} of {appointmentsTotalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setAppointmentsPage((prev) => Math.max(prev - 1, 1))}
                disabled={appointmentsPage === 1}
                className="px-3 py-1.5 text-sm font-medium rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setAppointmentsPage((prev) => Math.min(prev + 1, appointmentsTotalPages))}
                disabled={appointmentsPage === appointmentsTotalPages}
                className="px-3 py-1.5 text-sm font-medium rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentsPage;
