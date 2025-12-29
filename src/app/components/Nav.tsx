"use client";
import Image from "next/image";
import { Bebas_Neue } from "next/font/google";
import Link from "next/link";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "../firebase";
import { toast } from "react-toastify";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useUserStore } from "../store/userStore";

const bebasNeue = Bebas_Neue({ subsets: ["latin"], weight: ["400"] });

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
    <nav className="fixed w-full top-0 z-50 backdrop-blur-lg bg-black/50 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <div
                className={`${bebasNeue.className} antialiased flex items-center text-xl`}
              >
                <Image
                  alt="Logo"
                  width={32}
                  height={32}
                  src="/logo.png"
                  className="w-8 h-8 mr-px"
                />
                <p>Afghan Travel Agency</p>
              </div>
            </Link>
            <div className="hidden md:flex text-sm text-gray-400 gap-4">
              <Link
                href="/packages"
                className="hover:text-white transition-colors"
              >
                Packages
              </Link>
              <Link
                href="/about"
                className="hover:text-white transition-colors"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="hover:text-white transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/my-appointments"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 border border-white/20 bg-transparent text-white hover:bg-white hover:text-black transition-colors"
              >
                My Appointments
              </Link>
              {(role === "admin" || role === "superadmin") && (
                <Link
                  href="/admin"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 border border-orange-500/50 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20 transition-colors"
                >
                  Admin Panel
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-white text-black hover:bg-gray-200 transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 border border-white/20 bg-transparent text-white hover:bg-white hover:text-black transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/login?register=true"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-white text-black hover:bg-gray-200 transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Nav;
