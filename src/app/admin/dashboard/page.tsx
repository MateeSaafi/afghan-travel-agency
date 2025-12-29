"use client";
import React, { useState, useEffect } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import Link from "next/link";

type UserType = {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  role?: "user" | "admin" | "superadmin";
};

type Product = {
  id: string;
  name: string;
  category: string;
  headline: string;
  processTime: string;
  price: number;
  image: string;
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

const DashboardPage: React.FC = () => {
  const [appointments, setAppointments] = useState<AppointmentType[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersArr: UserType[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as UserType[];
      setUsers(usersArr);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "items"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itemsArr: Product[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Product[];
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Total Users",
            value: String(users.length || 0),
            change: `+${
              ((users.length -
                users.filter(
                  (user) =>
                    new Date(user.createdAt).toDateString() ===
                    new Date().toDateString()
                ).length) /
                users.length) *
              100
            }%`,
          },
          {
            title: "Total Products",
            value: String(products.length || 0),
            change: "",
          },
          {
            title: "Total Appointments",
            value: String(appointments.length || 0),
            change: "",
          },
          {
            title: "Pending",
            value: appointments.filter(
              (app) => app.status === "pending" || app.status === "documents_uploaded"
            ).length,
            change: "",
          },
        ].map((card, index) => (
          <div key={index} className="bg-zinc-900 border border-zinc-800 p-5 rounded-lg">
            <h3 className="text-zinc-400 text-sm font-medium">{card.title}</h3>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-semibold text-zinc-100">{card.value}</span>
              {card.change && (
                <span
                  className={`text-xs font-medium ${
                    card.change.startsWith("+")
                      ? "text-emerald-500"
                      : "text-zinc-500"
                  }`}
                >
                  {card.change}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-100">Pending Appointments</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Package</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments
                  .filter(
                    (appointment) =>
                      appointment.status === "pending" || appointment.status === "documents_uploaded"
                  )
                  .slice(0, 5)
                  .map((appointment) => (
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
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-100">Latest Users</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Email</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 5).map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-zinc-300">{user.name || "-"}</td>
                    <td className="px-4 py-3 text-sm text-zinc-400">{user.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-100">Latest Products</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Image</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Price</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Process Time</th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 5).map((prod) => (
                  <tr
                    key={prod.id}
                    className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-10 h-10 object-cover rounded-md"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-zinc-200">{prod.name}</div>
                      <div className="text-xs text-zinc-500">
                        {prod.headline}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-400">{prod.category}</td>
                    <td className="px-4 py-3 text-sm text-zinc-400">${prod.price}</td>
                    <td className="px-4 py-3 text-sm text-zinc-400">{prod.processTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
