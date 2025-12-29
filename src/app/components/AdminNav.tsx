"use client";
import Image from "next/image";
import { Bebas_Neue } from "next/font/google";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useUserStore } from "../store/userStore";
import { LogOut, Home } from "lucide-react";

const bebasNeue = Bebas_Neue({ subsets: ["latin"], weight: ["400"] });

const AdminNav = () => {
  const { clearUserRole } = useUserStore();
  const router = useRouter();

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

  return (
    <nav className="fixed w-full top-0 z-50 h-14 bg-zinc-950 border-b border-zinc-800/80">
      <div className="h-full px-4 sm:px-6">
        <div className="h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div
                className={`${bebasNeue.className} antialiased flex items-center text-lg text-zinc-100`}
              >
                <Image
                  alt="Logo"
                  width={28}
                  height={28}
                  src="/logo.png"
                  className="w-7 h-7 mr-1"
                />
                <span className="hidden sm:inline">Afghan Travel Agency</span>
              </div>
            </Link>
            <div className="hidden sm:block h-4 w-px bg-zinc-700" />
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-zinc-800 text-zinc-300 rounded-md border border-zinc-700">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium h-8 px-3 bg-zinc-900 text-zinc-300 border border-zinc-800 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
            >
              <Home size={14} />
              <span className="hidden sm:inline">Back to Site</span>
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium h-8 px-3 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 transition-colors"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNav;
