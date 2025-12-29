"use client";
import React, { useState, useEffect } from "react";
import { collection, query, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { toast } from "react-toastify";
import { useUserStore } from "../../store/userStore";

type UserType = {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  role?: "user" | "admin" | "superadmin";
};

const ITEMS_PER_PAGE = 10;

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const { role } = useUserStore();

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

  const updateUserRole = async (userId: string, newRole: "user" | "admin") => {
    if (role !== "superadmin") {
      toast.error("Only superadmins can change user roles");
      return;
    }
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { role: newRole });
      toast.success(`User role updated to ${newRole}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update role");
    }
  };

  const usersTotalPages = Math.ceil(users.length / ITEMS_PER_PAGE);
  const paginatedUsers = users.slice(
    (usersPage - 1) * ITEMS_PER_PAGE,
    usersPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-100">Users</h1>
        <span className="text-sm text-zinc-400">{users.length} total</span>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Role</th>
                {role === "superadmin" && (
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-zinc-300">{u.email}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{u.name || "-"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        u.role === "superadmin"
                          ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                          : u.role === "admin"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                      }`}
                    >
                      {u.role || "user"}
                    </span>
                  </td>
                  {role === "superadmin" && (
                    <td className="px-4 py-3">
                      {u.role !== "superadmin" && (
                        <div className="flex gap-2">
                          {u.role === "admin" ? (
                            <button
                              onClick={() => updateUserRole(u.id, "user")}
                              className="px-2.5 py-1 text-xs font-medium rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 transition-colors"
                            >
                              Demote
                            </button>
                          ) : (
                            <button
                              onClick={() => updateUserRole(u.id, "admin")}
                              className="px-2.5 py-1 text-xs font-medium rounded-md bg-zinc-100 text-zinc-900 hover:bg-zinc-200 transition-colors"
                            >
                              Make Admin
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {usersTotalPages > 1 && (
          <div className="flex justify-between items-center px-4 py-3 border-t border-zinc-800">
            <span className="text-sm text-zinc-500">
              Page {usersPage} of {usersTotalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setUsersPage((prev) => Math.max(prev - 1, 1))}
                disabled={usersPage === 1}
                className="px-3 py-1.5 text-sm font-medium rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setUsersPage((prev) => Math.min(prev + 1, usersTotalPages))}
                disabled={usersPage === usersTotalPages}
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

export default UsersPage;
