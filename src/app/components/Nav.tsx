"use client";
import Image from "next/image";
import Link from "next/link";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "../firebase";
import { toast } from "react-toastify";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useUserStore } from "../store/userStore";

const Nav = () => {
  const [user, setUser] = useState<User | null>(null);
  const { role, fetchUserRole, clearUserRole } = useUserStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser?.email) {
        fetchUserRole(currentUser.email);
      } else {
        clearUserRole();
      }
    });

    return () => unsubscribe();
  }, [fetchUserRole, clearUserRole]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      clearUserRole();
      toast.success("Logged out successfully.");
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out. Try again.");
    }
  };

  // Hide nav on admin pages (AdminNav is used instead)
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-night/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400"
          >
            <div className="font-display flex items-center gap-1.5 text-xl text-amber-50">
              <Image
                alt="Logo"
                width={32}
                height={32}
                src="/logo.png"
                className="w-8 h-8"
              />
              <p className="max-[380px]:hidden">Afghan Travel Agency</p>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-stone-400">
            <Link
              href="/packages"
              className="rounded-sm transition-colors hover:text-amber-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400"
            >
              Packages
            </Link>
            <Link
              href="/about"
              className="rounded-sm transition-colors hover:text-amber-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="rounded-sm transition-colors hover:text-amber-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400"
            >
              Contact
            </Link>
          </div>
        </div>
        {user ? (
          <div className="flex items-center gap-2">
            <Link
              href="/my-appointments"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-stone-700 px-3 sm:px-4 text-sm font-medium text-stone-200 transition-colors hover:border-amber-300/40 hover:text-amber-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
            >
              My Appointments
            </Link>
            {(role === "admin" || role === "superadmin") && (
              <Link
                href="/admin"
                className="inline-flex h-9 items-center justify-center rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 sm:px-4 text-sm font-medium text-amber-300 transition-colors hover:bg-amber-400/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
              >
                Admin Panel
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-stone-100 px-3 sm:px-4 text-sm font-semibold text-stone-900 transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-stone-700 px-3 sm:px-4 text-sm font-medium text-stone-200 transition-colors hover:border-amber-300/40 hover:text-amber-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
            >
              Sign In
            </Link>
            <Link
              href="/login?register=true"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-stone-100 px-3 sm:px-4 text-sm font-semibold text-stone-900 transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Nav;
