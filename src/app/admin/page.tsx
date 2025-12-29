"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useUserStore } from "../store/userStore";

const AdminPage: React.FC = () => {
  const router = useRouter();
  const [user, loadingAuth] = useAuthState(auth);
  const { role, isLoadingRole, fetchUserRole } = useUserStore();

  // Fetch user role when user is loaded
  useEffect(() => {
    if (user?.email) {
      fetchUserRole(user.email);
    }
  }, [user, fetchUserRole]);

  // Redirect to dashboard or home based on auth
  useEffect(() => {
    if (!loadingAuth && !isLoadingRole) {
      if (!user || (role !== "admin" && role !== "superadmin")) {
        router.replace("/");
      } else {
        router.replace("/admin/dashboard");
      }
    }
  }, [loadingAuth, isLoadingRole, user, role, router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-100 mx-auto"></div>
        <p className="mt-4 text-zinc-400">Loading...</p>
      </div>
    </div>
  );
};

export default AdminPage;
